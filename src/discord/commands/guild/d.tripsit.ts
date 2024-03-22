/* eslint-disable sonarjs/no-small-switch */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable max-len */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  ButtonBuilder,
  ModalSubmitInteraction,
  TextChannel,
  Colors,
  GuildMember,
  Role,
  ThreadChannel,
  ButtonInteraction,
  Message,
  MessageReaction,
  User,
  MessageMentionTypes,
  ChatInputCommandInteraction,
  PermissionResolvable,
  AllowedThreadTypeForTextChannel,
  Channel,
  DiscordErrorData,
  ChannelSelectMenuInteraction,
  StringSelectMenuInteraction,
  RoleSelectMenuInteraction,
  InteractionEditReplyOptions,
  SlashCommandBuilder,
  UserSelectMenuInteraction,
  ChannelSelectMenuBuilder,
  PermissionFlagsBits,
  RoleSelectMenuBuilder,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  GuildTextBasedChannel,
  EmbedBuilder,
  UserSelectMenuComponent,
  time,
  ColorResolvable,
} from 'discord.js';
import {
  TextInputStyle,
  ChannelType,
  ButtonStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { DateTime, Duration } from 'luxon';
import {
  ai_model,
  session_data,
  ticket_status, ticket_type, user_tickets, users,
} from '@prisma/client';
import { WordTokenizer, PorterStemmer, Spellcheck } from 'natural';
import wordlistEnglish from 'wordlist-english';
import OpenAI from 'openai';
import commandContext from '../../utils/context';
import { checkChannelPermissions, checkGuildPermissions } from '../../utils/checkPermissions';
import { SlashCommand } from '../../@types/commandDef';
import { SessionData } from '../../../global/@types/global';
import { getComponentById } from '../global/d.ai';
import { aiFlairMod } from '../../../global/commands/g.ai';

const tokenizer = new WordTokenizer();

const spellcheck = new Spellcheck([
  ...wordlistEnglish.english,
  // ...wordlistEnglish['english/british'],
  // ...wordlistEnglish['english/canadian'],
  // ...wordlistEnglish['english/australian'],
]);

const F = f(__filename);

/* TODO
* AI summary of the thread
* Stats page
* If no one responds after 5 minutes or so, suggest an AI tripsitter?
* Make sure Helper system still works
* Stats on the drug usage, anonymous of course
* Option to delete thread when closing?
* session menu
- Open session, how long they've been going on, etc
* Allow team to hard close, but include warning

* Make sure that the process in the help function works
* Reopening should only reset the status when the issue has been resolved/closed/archived, not when it's active
* When a session is reopened, we need a way to determine that someone has sent a message so we can change the status to owned
* Double check that the cleanup isnt doing that bs after 7 seconds still
*/

/* Testing Scripts

# Initialize
* As a user, create a new ticket
  Click the I need help button
  FIll in information
  Click submit
  - On BL your roles are not removed
  - On other guilds your roles are removed
  A thread is created
  The user, helpers and tripsitters are invited to that thread
* As a team member, can't create ticket
  Click the I need help button
  Bot responds "As a member of the team you cannot be publicly helped!"

# During
* As a user, continue a ticket that has not been deleted
  Click the I need help button
  Bot responds "As a member of the team you cannot be publicly helped!"
* As a user, talk in the thread
  Open the thread and talk
* As a team member, talk in the thread
  Open the thread and talk
* As a team member, Backup button works
  Click the Backup button
  Bot sends a notification to the channel that you need help

# End
* As a team member, prompt to end ticket
  Click the "they're good now" button
  Bot responds "Hey <user>, it looks like you're doing somewhat better!"
  Bot responds with a button that lets the user close the session
  Bot updates the name of the channel with a blue heart
* As a user, end ticket
  Click the "im good now"
  Bot updates the name of the channel with a green heart
  - On most guilds your roles are returned
  - On BL your roles are not removed
* As the system, archive the ticket after a period of time
  After 7 days since the user last talked, the channel is archived
* As the system, delete the ticket after a period of time
  After 14 days since the user last talked, the channel is deleted
*/

namespace text {
  export function deleteDuration() {
    return env.NODE_ENV === 'production'
      ? { days: 13 } // Needs to be under 14 days
      : { seconds: 100 };
  }

  export function archiveDuration() {
    return env.NODE_ENV === 'production'
      ? { days: 7 }
      : { seconds: 50 };
  }

  export function actionDefinition(
    action: type.TripSitAction,
  ):type.TripSitActionDefinition {
    const actionDef = {
      OPEN: {
        verb: 'opened',
        color: Colors.Red,
        emoji: '🆕',
      },
      OWNED: {
        verb: 'responded to',
        color: Colors.Orange,
        emoji: '🏠',
      },
      JOINED: {
        verb: 'joined',
        color: Colors.DarkOrange,
        emoji: '👥',
      },
      BLOCKED: {
        verb: 'blocked',
        color: Colors.DarkRed,
        emoji: '🚫',
      },
      PAUSED: {
        verb: 'paused',
        color: Colors.Grey,
        emoji: '⏸️',
      },
      REOPENED: {
        verb: 'reopened',
        color: Colors.DarkRed,
        emoji: '🔄',
      },
      RESOLVED: {
        verb: 'resolved',
        color: Colors.Blue,
        emoji: '😌',
      },
      CLOSED: {
        verb: 'closed',
        color: Colors.Green,
        emoji: '👍',
      },
      ARCHIVED: {
        verb: 'archived',
        color: Colors.Purple,
        emoji: '📦',
      },
      DELETED: {
        verb: 'deleted',
        color: Colors.NotQuiteBlack,
        emoji: '🗑️',
      },
      ANALYZE: {
        verb: 'analyzed',
        color: Colors.DarkBlue,
        emoji: '🔍',
      },
    };
    return actionDef[action];
  }

  export function threadName(
    target: GuildMember,
    status: type.TripSitAction,
  ):string {
    return `${text.actionDefinition(status).emoji}│${target.displayName}'s session`;
  }

  export function guildOnly() {
    return 'This must be performed in a guild!';
  }

  export function memberOnly() {
    return 'This must be performed by a member of a guild!';
  }

  export function title() {
    return '**Need to talk with a TripSitter? Click the button below!**';
  }

  export function description() {
    return stripIndents`
    **Need mental health support?**
    Check out [Huddle Humans](https://discord.gg/mentalhealth), a mental health universe!

    **Want professional mental health advisors?**
    The [Warmline Directory](https://warmline.org/warmdir.html#directory) provides non-crisis mental health support and guidance from trained volunteers (US Only).

    **Looking for voice chat?**
    The wonderful people at the [Fireside project](https://firesideproject.org) can also help you through a rough trip! (US Only)
  
    **Having an emergency?**
    We're not doctors: If you are in a medical emergency, please contact emergency medical services.

    **Are you suicidal?**
    If you're having suicidal thoughts please contact your [local hotline](https://en.wikipedia.org/wiki/List_of_suicide_crisis_lines).
    `;
  }

  export function footer() {
    return '🛑 Please do not message anyone directly! 🛑';
  }

  export function buttonText() {
    return 'I want to talk with a tripsitter!';
  }

  export function buttonEmoji() {
    return '⭐';
  }

  export function rateOne() {
    return '🙁';
  }

  export function rateTwo() {
    return '😕';
  }

  export function rateThree() {
    return '😐';
  }

  export function rateFour() {
    return '🙂';
  }

  export function rateFive() {
    return '😁';
  }

}

namespace type {
  export type TripSitInteraction = ChatInputCommandInteraction | ButtonInteraction | ChannelSelectMenuInteraction | RoleSelectMenuInteraction;

  export type TripSitAction = ticket_status | 'REOPENED' | 'JOINED' | 'ANALYZE';

  export type TripSitActionDefinition = {
    verb: string;
    color: ColorResolvable;
    emoji: string;
  };

  export type TripSitActionDict = {
    [K in TripSitAction]: TripSitActionDefinition;
  };
}

namespace modal {
  export async function updateEmbed(
    interaction: ButtonInteraction,
  ) {
    if (!interaction.guild) return;
    if (!interaction.channel) return;
    if (interaction.channel.type !== ChannelType.GuildText) return;

    const S = 'updateEmbed';

    await util.sessionDataInit(interaction.guild.id);

    await interaction.showModal(new ModalBuilder()
      .setCustomId(`tripsitmeModal~${interaction.id}`)
      .setTitle('Setup your TripSit Room\'s Embed!')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(
            new TextInputBuilder()
              .setLabel('Title')
              .setValue(`${global.sessionsSetupData[interaction.guild.id].title}`)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setCustomId('tripsit~title'),
          ),
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(
            new TextInputBuilder()
              .setLabel('Description')
              .setValue(`${global.sessionsSetupData[interaction.guild.id].description}`)
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
              .setCustomId('tripsit~description'),
          ),
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(
            new TextInputBuilder()
              .setLabel('Footer')
              .setValue(`${global.sessionsSetupData[interaction.guild.id].footer}`)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setCustomId('tripsit~footer'),
          ),
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(
            new TextInputBuilder()
              .setLabel('Button Text')
              .setValue(`${global.sessionsSetupData[interaction.guild.id].buttonText}`)
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setMinLength(1)
              .setMaxLength(80)
              .setCustomId('tripsit~buttonText'),
          ),
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(
            new TextInputBuilder()
              .setLabel('Button Emoji')
              .setValue(`${global.sessionsSetupData[interaction.guild.id].buttonEmoji}`)
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Accepts Unicode or Custom Emoji: Use format <:emojiName:emojiID> or just emojiID')
              .setRequired(true)
              .setMinLength(1)
              .setMaxLength(80)
              .setCustomId('tripsit~buttonEmoji'),
          ),
      ));

    const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('tripsitmeModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (i.customId.split('~')[1] !== interaction.id) return;
        if (!i.isModalSubmit()) return;
        if (!i.isFromMessage()) return;
        if (!interaction.guild) return;
        if (!i.guild) return;

        const sessionData = global.sessionsSetupData[i.guild.id];

        // Validate the emoji given
        const emoji = i.fields.getTextInputValue('tripsit~buttonEmoji');
        log.debug(F, `[${S}] Emoji: ${emoji}`);

        // This regex matches some common Unicode emojis; it's not exhaustive.
        const isStandardEmoji = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu.exec(emoji);
        log.debug(F, `[${S}] isStandardEmoji: ${isStandardEmoji}`);

        // Extract the ID from the custom emoji format
        const isCustomEmoji = /^<a?:.+:(\d+)>$/.exec(emoji);
        log.debug(F, `[${S}] isCustomEmoji: ${isCustomEmoji}`);

        const isEmojiId = /^\d+$/.exec(emoji);
        log.debug(F, `[${S}] isEmojiId: ${isEmojiId}`);

        if (!isStandardEmoji && !isCustomEmoji && !isEmojiId) {
          await i.reply({
            content: 'Please provide a valid emoji!',
            ephemeral: true,
          });
          return;
        }

        if (isCustomEmoji) {
          // Check if the emoji exists in the guild
          try {
            const guildEmoji = await interaction.guild.emojis.fetch(isCustomEmoji[1]);
            if (!guildEmoji) {
              await i.reply({
                content: 'Your custom emoji must be from this server!',
                ephemeral: true,
              });
              return;
            }
          } catch (err) {
            await i.reply({
              content: 'Your custom emoji must be from this server!',
              ephemeral: true,
            });
            return;
          }
        }

        sessionData.title = i.fields.getTextInputValue('tripsit~title');
        sessionData.description = i.fields.getTextInputValue('tripsit~description');
        sessionData.footer = i.fields.getTextInputValue('tripsit~footer');
        sessionData.buttonText = i.fields.getTextInputValue('tripsit~buttonText');
        sessionData.buttonEmoji = isCustomEmoji ? isCustomEmoji[1] : emoji;

        // Idt this is necessary but just to be sure
        global.sessionsSetupData[i.guild.id] = sessionData;

        // log.debug(F, `[${S}] SessionData: ${JSON.stringify(sessionData, null, 2)}`);

        await i.update(await page.setupPageThree(interaction));
      });
  }
}

namespace session {
  export async function create(
    interaction: ButtonInteraction,
    target: GuildMember,
    userData: users,
  ) {
    const S = 'create';
    if (!interaction.guild) return;
    if (!interaction.member) return;

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    await interaction.showModal(new ModalBuilder()
      .setCustomId(`tripsitmeSubmit~${interaction.id}`)
      .setTitle('Tripsitter Help Request')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(new TextInputBuilder()
            .setCustomId('triageInput')
            .setLabel('What substance? How much taken? How long ago?')
            .setMaxLength(100)
            .setStyle(TextInputStyle.Short)),
        new ActionRowBuilder<TextInputBuilder>()
          .addComponents(new TextInputBuilder()
            .setCustomId('introInput')
            .setLabel('What\'s going on? Give us the details!')
            .setMaxLength(500)
            .setStyle(TextInputStyle.Paragraph)),
      ));

    const filter = (i: ModalSubmitInteraction) => i.customId.startsWith('tripsitmeSubmit');
    await interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        if (!interaction.guild) return;
        if (!interaction.member) return;
        if (i.customId.split('~')[1] !== interaction.id) return;
        await i.deferReply({ ephemeral: true });

        const triage = i.fields.getTextInputValue('triageInput').split('\n').map(line => `> ${line}`).join('\n');
        const intro = i.fields.getTextInputValue('introInput').split('\n').map(line => `> ${line}`).join('\n');

        // let backupMessage = 'Hey ';
        // Get the roles we'll be referencing
        let tripsitterRoles = [] as Role[];
        if (sessionData.tripsitterRoles) {
          tripsitterRoles = await Promise.all(sessionData.tripsitterRoles.map(async roleId => await interaction.guild?.roles.fetch(roleId) as Role));
        }

        // log.debug(F, `[${S}] tripsitterRoles: ${tripsitterRoles})`);
        // log.debug(F, `[${S}] channelTripsitmeta: ${channelTripsitmeta.name} (${channelTripsitmeta.id})`);

        // Get the tripsit channel from the guild
        let tripsitChannel = {} as TextChannel;
        try {
          if (sessionData.tripsitChannel) {
            tripsitChannel = await interaction.guild.channels.fetch(sessionData.tripsitChannel) as TextChannel;
          }
        } catch (err) {
          // log.debug(F, `[sessionNew] There was an error fetching the tripsit channel, it was likely deleted:\n ${err}`);
        }

        if (!tripsitChannel.id) {
          // log.debug(F, `[${S}] no tripsit channel!`);
          await interaction.editReply({ content: 'No tripsit channel found! Make sure to run /tripsit setup' });
          return;
        }

        await util.needsHelpMode(interaction, target);

        // Create a new thread in the channel
        const thread = await tripsitChannel.threads.create({
          name: text.threadName(target, 'OPEN'),
          autoArchiveDuration: 1440,
          type: ChannelType.PrivateThread as AllowedThreadTypeForTextChannel,
          reason: `${target.displayName} requested help`,
          invitable: false,
        });
        log.info(F, `[${S}] Created thread: ${thread.name} (${thread.id})`);

        // Team check - Cannot be run on team members
        // If this user is a developer then this is a test run and ignore this check,
        // but we'll change the output down below to make it clear this is a test.
        let targetIsTeamMember = false;
        target.roles.cache.forEach(async role => {
          if (sessionData.tripsitterRoles?.includes(role.id)) {
            targetIsTeamMember = true;
          }
        });

        // log.debug(F, `[${S}] targetIsTeamMember: ${targetIsTeamMember}`);

        const noInfo = '\n*No info given*';
        const firstMessage = await thread.send({
          content: stripIndents`
            Hello ${target},
            
            It's good to see you reaching out 🌟. We're here to navigate this together.

            A member of our team will try to connect with you as soon as possible. We're all volunteers doing our best to be there for each other, so your patience is greatly appreciated 🙏.

            If this situation escalates to a medical emergency 🚑, it's crucial to contact your local emergency services directly - we're not equipped to initiate EMS calls.
            
            **Want to talk to a mental health advisor? The [warm line directory](https://warmline.org/warmdir.html#directory) provides info on non-crisis mental health support and guidance from trained volunteers.**

            **Want to talk to someone on the phone? The wonderful people at the [Fireside project](https://firesideproject.org) can also help you through a rough trip.**

            Feeling a shift towards calmness? Hit the "👍 I'm Good" button to signal to our team that you're on more solid ground.      

            Substances involved:
            ${triage ? `${triage}` : noInfo}

            Your concern:
            ${intro ? `${intro}` : noInfo}

            ${tripsitterRoles.join(' ')}
          `,
          components: [
            new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                button.sessionHardClose(target.id),
              ),
          ],
          allowedMentions: {
          // parse: showMentions,
            parse: ['users', 'roles'] as MessageMentionTypes[],
          },
          flags: ['SuppressEmbeds'],
        });

        try {
          await firstMessage.pin();
        } catch (error) {
          log.error(F, `[${S}] Failed to pin message: ${error}`);
          const guildOwner = await interaction.guild?.fetchOwner();
          await guildOwner?.send({
            content: stripIndents`There was an error pinning a message in ${thread.name}!
              Please make sure I have the Manage Messages permission in this room!
              If there's any questions please contact Moonbear#1024 on TripSit!
            `,
            }); // eslint-disable-line
        }

        // log.debug(F, `[${S}] Sent intro message to ${thread.name}  ${ticket.thread_id}`);

        // log.debug(F, `[${S}] Ticket archives on ${archiveTime.toLocaleString(DateTime.DATETIME_FULL)} deletes on ${deleteTime.toLocaleString(DateTime.DATETIME_FULL)}`);

        // Create the ticket in the DB
        const ticketDescription: string = stripIndents`
          ### Substances Involved
          ${triage ? `${triage}` : noInfo}
          ### Their Concern
          ${intro ? `${intro}` : noInfo}
        `;
        let ticketData = await db.user_tickets.create({
          data: {
            user_id: userData.id,
            description: ticketDescription,
            guild_id: interaction.guild.id,
            thread_id: thread.id,
            type: 'TRIPSIT',
            status: 'OPEN',
            archived_at: DateTime.utc().plus(text.archiveDuration()).toJSDate(),
            deleted_at: DateTime.utc().plus(text.deleteDuration()).toJSDate(),
          },
        });

        await util.analyze(ticketDescription, ticketData);

        if (!thread) {
          await i.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.DarkBlue)
                .setDescription(stripIndents`
                  Hey ${interaction.member}, there was an error creating your help thread! The Guild owner should get a message with specifics!
                `),
            ],
          });
          return;
        }

        try {
          await i.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.DarkBlue)
                .setDescription(stripIndents`
                  Hey ${target}, thank you for asking for assistance!
                  
                  Click here to be taken to your private room: ${thread.toString()}
              
                  You can also click in your channel list to see your private room!
                `),
            ],
          });
        } catch (err) {
          log.error(F, `[${S}] There was an error responding to the user! ${err}`);
          log.error(F, `[${S}] Error: ${JSON.stringify(err, null, 2)}`);
        }

        ticketData = await db.user_tickets.findUniqueOrThrow({
          where: { id: ticketData.id },
        });

        await util.sendLogMessage('OPEN', ticketData, interaction.member as GuildMember);
      });
  }

  export async function own(
    message: Message,
  ) {
    if (!message.guild) return;
    if (!message.channel) return;
    if (!message.member) return;
    if (message.channel.isDMBased()) return;
    const S = 'own';

    const ticketData = await db.user_tickets.findFirstOrThrow({
      where: {
        thread_id: message.channel.id,
      },
    });

    const userData = await db.users.upsert({
      where: { discord_id: message.author.id },
      create: { discord_id: message.author.id },
      update: {},
    });

    if ((!ticketData.first_response_by && ticketData.user_id !== userData.id)) {
      // Check if the first_response_by field is null, and if it's a different user than the person who made the thread
      await db.user_tickets.update({
        where: { id: ticketData.id },
        data: {
          first_response_by: userData.id,
          first_response_at: new Date(),
        },
      });
      log.info(F, `[${S}] Added ${message.member.displayName} (${message.author.id}) as the first response user for thread ${message.channel.name}`);

      const ticketUserData = await db.users.findFirst({
        where: { id: ticketData.user_id },
      });

      const ticketMember = await message.guild.members.fetch(ticketUserData?.discord_id as string);

      // Change the name of the thread
      await message.channel.setName(text.threadName(ticketMember, 'OWNED'));

      // Update the database
      await db.user_tickets.update({
        where: { id: ticketData.id },
        data: {
          first_response_by: userData.id,
          first_response_at: new Date(),
        },
      });
      log.debug(F, `[${S}] Added <@!${message.author.id}> as the first response user for thread ${message.channel.name} in the DB`);

      await db.user_ticket_participant.create({
        data: {
          ticket_id: ticketData.id,
          user_id: userData.id,
          messages: 1,
        },
      });
      log.info(F, `[${S}] Added ${message.member.displayName} (${message.author.id}) to the participants list for thread ${message.channel.name}`);

      await util.sendLogMessage('OWNED', ticketData, message.member);
    }
  }

  export async function join(
    message: Message,
  ) {
    if (!message.guild) return;
    if (!message.channel) return;
    if (!message.member) return;
    if (message.channel.isDMBased()) return;
    const S = 'join';
    const ticketData = await db.user_tickets.findFirstOrThrow({
      where: {
        thread_id: message.channel.id,
      },
    });

    // Add the user to the participant list if they're not already in it
    // Either way, increment the messages sent
    let participationData: {
      ticket_id: string;
      user_id: string;
      messages: number;
    };
    const userData = await db.users.upsert({
      where: { discord_id: message.author.id },
      create: { discord_id: message.author.id },
      update: {},
    });

    // Can't add the ticket owner to the list of participants
    if (ticketData.user_id === userData.id) return;

    // log.debug(F, `${S}: ${JSON.stringify(userData, null, 2)}`);
    const existingParticipant = await db.user_ticket_participant.findFirst({
      where: {
        ticket_id: ticketData.id,
        user_id: userData.id,
      },
    });
    if (existingParticipant) {
      // log.debug(F, `[${S}] Found existing participant: ${JSON.stringify(existingParticipant, null, 2)}`);
      participationData = await db.user_ticket_participant.update({
        where: {
          ticket_id_user_id: {
            ticket_id: ticketData.id,
            user_id: userData.id,
          },
        },
        data: {
          messages: {
            increment: 1,
          },
        },
      });
      log.debug(F, `[${S}] ${message.member.displayName} (${message.author.id}) has now sent ${participationData.messages} in thread ${message.channel.name}`);
    } else {
      participationData = await db.user_ticket_participant.create({
        data: {
          ticket_id: ticketData.id,
          user_id: userData.id,
          messages: 1,
        },
      });
      log.info(F, `[${S}] Added ${message.member.displayName} (${message.author.id}) to the participants list for thread ${message.channel.name}`);

      await util.sendLogMessage('JOINED', ticketData, message.member);
    }
  }

  // export async function block() {

  // }

  // export async function pause() {

  // }

  export async function reopen(
    interaction: ButtonInteraction,
    target: GuildMember,
    ticketData: user_tickets,
  ) {
    if (!interaction.guild) return;
    if (!interaction.member) return;
    const S = 'reopen';
    log.info(F, `[${S}] ${target.displayName} (${target.id}) has an open ticket, attempting to continue`);
    // log.debug(F, `[sessionContinue] Target has tickets: ${JSON.stringify(ticketData, null, 2)}`);

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    let thread = {} as ThreadChannel;
    try {
      thread = await interaction.guild?.channels.fetch(ticketData.thread_id) as ThreadChannel;
    } catch (err) {
      log.debug(F, `[${S}] There was an error updating ${target.displayName} (${target.id})'s help thread, it was likely deleted`);
      // Update the ticket status to closed

      await db.user_tickets.update({
        where: { id: ticketData.id },
        data: {
          status: 'DELETED' as ticket_status,
          archived_at: DateTime.utc().toJSDate(),
          deleted_at: DateTime.utc().toJSDate(),
        },
      });
      // log.debug(F, '[${S}] Updated ticket status to DELETED');
    }

    // If the thread exists
    if (thread.id) {
      await interaction.deferReply({ ephemeral: true });
      await util.needsHelpMode(interaction, target);
      // log.debug(F, '[${S}] Added needshelp to user');
      let tripsitterRoles = [] as Role[];
      let removeRoles = [] as Role[];
      let giveRoles = [] as Role[];
      if (sessionData.tripsitterRoles) {
        tripsitterRoles = await Promise.all(sessionData.tripsitterRoles.map(async roleId => await interaction.guild?.roles.fetch(roleId) as Role));
      }

      if (sessionData.removingRoles) {
        removeRoles = await Promise.all(sessionData.removingRoles.map(async roleId => await interaction.guild?.roles.fetch(roleId) as Role));
      }

      if (sessionData.givingRoles) {
        giveRoles = await Promise.all(sessionData.givingRoles.map(async roleId => await interaction.guild?.roles.fetch(roleId) as Role));
      }
      // log.debug(F, `[${S}] Tripsitter Roles : ${tripsitterRoles.length}`);
      // log.debug(F, `[${S}] Remove Roles : ${removeRoles.length}`);
      // log.debug(F, `[${S}] Giving Roles : ${giveRoles.length}`);

      // Check if the created_by is in the last 5 minutes
      // log.debug(F, `[${S}] ticketData.created_at: ${ticketData.created_at}`);
      // log.debug(F, `[${S}] ticketData.reopened_at: ${ticketData.reopened_at}`);

      // Send the update message to the thread
      const teamInitialized = (interaction.member as GuildMember).id !== target.id;
      let helpMessage = teamInitialized
        ? stripIndents`Hey ${target}, the team thinks you could still use some help, lets continue talking here!`
        : stripIndents`Hey ${target}, thanks for asking for help, we can continue talking here! What's up?`;

      const minutes = DateTime.utc()
        .diff(DateTime.fromJSDate(new Date(ticketData.reopened_at ?? ticketData.created_at)), 'minutes')
        .as('minutes');
      // log.debug(F, `[${S}] Minutes since last reopen: ${minutes}`);
      if (minutes > 5 && sessionData.tripsitterRoles) {
        helpMessage += '\n\nSomeone from the team will be with you as soon as they\'re available!';

        await Promise.all(sessionData.tripsitterRoles.map(async roleId => {
          try {
            const roleTripsitter = await interaction.guild?.roles.fetch(roleId) as Role;
            helpMessage += `<@&${roleTripsitter.id}> `;
          } catch (err) {
            // log.debug(F, `[${S}] Role ${roleId} was likely deleted`);
          }
        }));
      }
      await thread.send({
        content: helpMessage,
        allowedMentions: {
          // parse: showMentions,
          parse: ['users', 'roles'] as MessageMentionTypes[],
        },
      });
      log.info(F, `[${S}] Told user they already have an open channel`);
      await thread.setName(text.threadName(target, 'OPEN'));

      await db.user_tickets.update({
        where: {
          id: ticketData.id,
        },
        data: {
          status: 'OPEN' as ticket_status,
          reopened_at: new Date(),
          archived_at: DateTime.utc().plus(text.deleteDuration()).toJSDate(),
          deleted_at: DateTime.utc().plus(text.archiveDuration()).toJSDate(),
        },
      });

      if (teamInitialized) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.DarkBlue)
              .setDescription(stripIndents`
                Hey ${interaction.member}, ${target.displayName} already has an open ticket!
                Check your channel list or click '${thread.toString()} to see!
              `),
          ],
        });
      } else {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.DarkBlue)
              .setDescription(stripIndents`
                Hey ${interaction.member}, already you have an open session!
    
                Check your channel list or click '${thread.toString()} to return to your thread.
              `),
          ],
        });
      }

      await util.sendLogMessage('REOPENED', ticketData, interaction.member as GuildMember);
    } else {
      // The thread was likely manually deleted, clear out the ticket and start a new session
      await db.user_tickets.update({
        where: {
          id: ticketData.id,
        },
        data: {
          status: 'DELETED' as ticket_status,
          archived_at: DateTime.utc().toJSDate(),
          deleted_at: DateTime.utc().toJSDate(),
        },
      });
      const userData = await db.users.upsert({
        where: { discord_id: target.id },
        create: { discord_id: target.id },
        update: {},
      });
      await session.create(interaction, target, userData);
    }
  }

  export async function resolve(
    interaction: ButtonInteraction,
  ) {
    if (!interaction.guild) return;
    if (!interaction.member) return;
    if (!interaction.channel) return;
    const S = 'resolve';

    const targetId = interaction.customId.split('~')[2];

    log.debug(F, `[${S}] targetId: ${targetId}`);

    await interaction.deferReply({ ephemeral: true });

    let target = null as GuildMember | null;
    try {
      target = await interaction.guild.members.fetch(targetId);
    } catch (err) {
      // log.debug(F, `[${S}] [tripsitmeBackup] There was an error fetching the target, it was likely deleted:\n ${err}`);
      // await interaction.editReply({ content: 'Sorry, this user has left the guild.' });
      // return;
    }

    if (!target) {
      // log.debug(F, `[${S}] [tripsitmeBackup] target ${targetId} not found!`);
      await interaction.editReply({ content: 'Sorry, this user has left the guild.' });
      return;
    }

    const actor = interaction.member as GuildMember;

    if (targetId === actor.id) {
      // log.debug(F, `[${S}] [tripsitmeBackup] not the target!`);
      await interaction.editReply({ content: 'You should not be able to see this button!' });
      return;
    }

    const userData = await db.users.upsert({
      where: { discord_id: target.id },
      create: { discord_id: target.id },
      update: {},
    });

    const actorData = await db.users.upsert({
      where: { discord_id: actor.id },
      create: { discord_id: actor.id },
      update: {},
    });

    log.debug(F, `[${S}] userData: ${JSON.stringify(userData, null, 2)}`);

    const ticketData = await db.user_tickets.findFirst({
      where: {
        user_id: userData.id,
        status: {
          not: {
            in: ['CLOSED', 'DELETED'],
          },
        },
      },
    });

    log.debug(F, `[${S}] ticketData: ${JSON.stringify(ticketData, null, 2)}`);

    if (!ticketData) {
      // log.debug(F, `[${S}] target ${target} does not need help!`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.DarkBlue)
            .setDescription(`Hey ${(interaction.member as GuildMember).displayName}, ${target ? target.displayName : 'this user'} does not have an open session!`),
        ],
      });
      return;
    }

    if (ticketData.status === 'RESOLVED') {
      // log.debug(F, `[${S}] target ${target} does not have an open session!`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.DarkBlue)
            .setDescription(`Hey ${(interaction.member as GuildMember).displayName}, this session is already resolved!`),
        ],
      });
      return;
    }

    // log.debug(F, `[${S}] ticketData: ${JSON.stringify(ticketData, null, 2)}`);
    if (Object.entries(ticketData).length === 0) {
      // log.debug(F, `[${S}] target ${target} does not need help!`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.DarkBlue)
            .setDescription(`Hey ${(interaction.member as GuildMember).displayName}, ${target ? target.displayName : 'this user'} does not have an open session!`),
        ],
      });
      return;
    }

    // Get the channel objects for the help thread
    let thread = {} as ThreadChannel;
    try {
      thread = await interaction.guild.channels.fetch(ticketData.thread_id) as ThreadChannel;

      const targetMember = await interaction.guild.members.fetch(target.id);

      // Replace the first character of the channel name with a blue heart using slice to preserve the rest of the name
      await thread.setName(text.threadName(targetMember, 'RESOLVED'));
    } catch (err) {
      // log.debug(F, `[${S}] There was an error updating the help thread, it was likely deleted:\n ${err}`);
      // Update the ticket status to closed
      await db.user_tickets.update({
        where: {
          id: ticketData.id,
        },
        data: {
          status: 'DELETED' as ticket_status,
          archived_at: DateTime.utc().toJSDate(),
          deleted_at: DateTime.utc().toJSDate(),
        },
      });
      interaction.editReply({ content: 'It looks like this thread was deleted, so consider this closed!' });
      // log.debug(F, `[${S}] Updated ticket status to DELETED`);
    }

    if (thread.archived) {
      await thread.setArchived(false);
      log.debug(F, `[${S}] Un-archived ${thread.name}`);
    }

    await thread.send({
      content: stripIndents`
        Hey ${target}, it looks like you're doing somewhat better!
        If everything is good on your end, you can close the session by clicking the button below.
      `,
      components: [
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            button.sessionHardClose(target.id),
          ),
      ],
    });

    await db.user_tickets.update({
      where: {
        id: ticketData.id,
      },
      data: {
        status: 'RESOLVED' as ticket_status,
        resolved_by: actorData.id,
        resolved_at: DateTime.utc().toJSDate(),
        archived_at: DateTime.utc().plus(text.archiveDuration()).toJSDate(),
        deleted_at: DateTime.utc().plus(text.deleteDuration()).toJSDate(),
      },
    });

    log.debug(F, `[${S}] Updated ticket status to RESOLVED`);

    const sessionData = await util.sessionDataInit(interaction.guild?.id);

    await util.sendLogMessage('RESOLVED', ticketData, actor);

    // log.debug(F, `[${S}] ${target.user.tag} (${target.user.id}) is no longer being helped!`);
    await interaction.editReply({ content: 'I sent the close button to the thread!' });
  }

  export async function close(
    interaction: ButtonInteraction,
  ) {
    if (!interaction.guild) return;
    if (!interaction.member) return;
    if (!interaction.channel) return;
    const S = 'close';

    const targetId = interaction.customId.split('~')[2];

    const actor = interaction.member as GuildMember;

    if (targetId !== actor.id) {
      const override = interaction.customId.split('~')[3];
      if (!override) {
        await interaction.reply({
          content: stripIndents`
          Only the session creator can close the session! 
          
          You can invite the user to close the session with the button below!`,
          ephemeral: true,
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(button.sessionSoftClose(targetId)),
          ],
        });
      }
      return;
    }

    const target = await interaction.guild.members.fetch(targetId);

    log.debug(F, `[${S}] targetId: ${target.id}`);

    const userData = await db.users.upsert({
      where: { discord_id: target.id },
      create: { discord_id: target.id },
      update: {},
    });

    const actorData = await db.users.upsert({
      where: { discord_id: actor.id },
      create: { discord_id: actor.id },
      update: {},
    });

    log.debug(F, `[${S}] userData: ${JSON.stringify(userData, null, 2)}`);

    const ticketData = await db.user_tickets.findFirst({
      where: {
        user_id: userData.id,
        status: {
          not: {
            in: ['CLOSED', 'DELETED'],
          },
        },
      },
    });

    if (!ticketData) {
      // We don't actually want to update anything but we still need to respond to the interaction
      await interaction.update({});
      return;
    }

    await interaction.deferReply({ ephemeral: false });

    // log.debug(F, `[${S}] ticketData: ${JSON.stringify(ticketData, null, 2)}`);
    if (Object.entries(ticketData).length === 0) {
      // log.debug(F, `[${S}] target ${target} does not need help!`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.DarkBlue)
            .setDescription(stripIndents`
              Hey ${(interaction.member as GuildMember).displayName}, you do not have an open session!
              If you need help, please click the button again!
            `),
        ],
      });
      return;
    }

    // log.debug(F, `[${S}] ticketData: ${JSON.stringify(ticketData, null, 2)}`);
    if (ticketData.status === 'CLOSED') {
      // log.debug(F, `[${S}] target ${target} does not have an open session!`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.DarkBlue)
            .setDescription(stripIndents`
              Hey ${(interaction.member as GuildMember).displayName}, you already closed this session!
            `),
        ],
      });
      return;
    }

    // Remove the needshelp role
    // let roleNeedshelp = {} as Role;

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    if (sessionData?.givingRoles) {
      await Promise.all(sessionData.givingRoles.map(async roleId => {
        try {
          const roleToRemove = await interaction.guild?.roles.fetch(roleId) as Role;
          await target.roles.remove(roleToRemove);
        } catch (err) {
          // log.debug(F, `[${S}] There was an error fetching the needshelp role, it was likely deleted:\n ${err}`);
        }
      }));
    }

    // let channelTripsitmeta = {} as TextChannel;
    // if (sessionData?.metaChannel) {
    //   try {
    //     channelTripsitmeta = await interaction.guild.channels.fetch(sessionData.metaChannel) as TextChannel;
    //   } catch (err) {
    //     // log.debug(F, `[${S}] There was an error fetching the meta channel, it was likely deleted:\n ${err}`);
    //   }
    // }

    // Re-add old roles
    await util.restoreRoles(ticketData);

    // Get the thread
    // Need to double check that it wasn't manually deleted
    let thread = {} as ThreadChannel;
    try {
      thread = await interaction.guild.channels.fetch(ticketData.thread_id) as ThreadChannel;
    } catch (err) {
      // log.debug(F, `[${S}] There was an error updating the help thread, it was likely deleted:\n ${err}`);
      // Update the ticket status to closed
      await db.user_tickets.update({
        where: {
          id: ticketData.id,
        },
        data: {
          status: 'DELETED' as ticket_status,
          archived_at: DateTime.utc().toJSDate(),
          deleted_at: DateTime.utc().toJSDate(),
        },
      });
      await interaction.editReply({ content: 'Could not find this help thread, it was likely deleted manually!' });
      return;
      // log.debug(F, `[${S}] Updated ticket status to DELETED`);
    }

    if (thread.archived) {
      // We can't send messages to an archived channel
      await thread.setArchived(false);
      log.debug(F, `[${S}] Un-archived ${thread.name}`);
    }

    // Send the end message to the user
    try {
      await interaction.editReply(stripIndents`
        Hey ${target}, we're glad you're doing better!
        We've restored your old roles back to normal <3
        This thread will remain here for ${Object.values(text.archiveDuration())[0]} ${Object.keys(text.archiveDuration())[0]} if you want to follow up tomorrow.
        After ${Object.values(text.deleteDuration())[0]} ${Object.keys(text.deleteDuration())[0]}, or on request, it will be deleted to preserve your privacy =)
      `);
    } catch (err) {
      log.error(F, `[${S}] Error sending end help message to ${thread}`);
      log.error(F, err as string);
    }

    // Send the survey
    let message: Message;

    // If there has not already been a survey collected, send the survey message
    if (!ticketData.survey_response) {
      await thread.send(stripIndents`
          ${emojiGet('Invisible')}
          > **If you have a minute, your feedback is important to us!**
          > Please rate your experience with ${interaction.guild.name}'s service by reacting below.
          > Thank you!
          ${emojiGet('Invisible')}
          `)
        .then(async msg => {
          message = msg;
          await msg.react(text.rateOne());
          await msg.react(text.rateTwo());
          await msg.react(text.rateThree());
          await msg.react(text.rateFour());
          await msg.react(text.rateFive());
        });
    }

    // Do this last because it looks weird to have it happen in-between messages
    await thread.setName(text.threadName(target, 'CLOSED'));

    await db.user_tickets.update({
      where: {
        id: ticketData.id,
      },
      data: {
        status: 'CLOSED' as ticket_status,
        closed_at: new Date(),
        closed_by: userData.id,
        archived_at: DateTime.utc().plus(text.archiveDuration()).toJSDate(),
        deleted_at: DateTime.utc().plus(text.deleteDuration()).toJSDate(),
      },
    });
    log.debug(F, `[${S}] Updated ticket status to CLOSED`);

    await util.sendLogMessage('CLOSED', ticketData, actor);
  }

  export async function archive() {
    // Process tickets
    // Remember: The archived_at value is set ahead of time and determines the future time the thread will be archived
    // So we get a list of all tickets that have this date in the past
    const S = 'archive';
    const ticketData = await db.user_tickets.findMany({
      where: {
        archived_at: {
          not: undefined,
          lte: new Date(), // Less than or equal to now
        },
        status: { notIn: ['DELETED', 'ARCHIVED', 'PAUSED'] },
      },
    });

    // log.debug(F, `[${S}] archiveTicketData: ${JSON.stringify(ticketData, null, 2)}`);

    // Get the log channel
    // Loop through each ticket
    if (ticketData.length > 0) {
      ticketData.forEach(async ticket => {
        // Archive the thread on discord
        let thread = {} as null | Channel;
        try {
          thread = await global.discordClient.channels.fetch(ticket.thread_id);
        } catch (err) {
          log.debug(F, `[${S}] Thread ${ticket.thread_id} was likely manually deleted`);
        }

        if (!thread?.isThread()) return;
        log.info(F, `[${S}] Archiving session ${thread.name}`);

        await thread.setArchived(true, 'Automatically archived.');

        // Update the ticket in the database
        const updatedTicket = await db.user_tickets.update({
          where: { id: ticket.id },
          data: {
            status: 'ARCHIVED' as ticket_status,
            deleted_at: DateTime.utc().plus(text.deleteDuration()).toJSDate(),
          },
        });
        log.info(F, `[${S}] Updated the db`);

        await util.sendLogMessage('ARCHIVED', updatedTicket);
        await util.restoreRoles(updatedTicket);
      });
    }
  }

  export async function remove() {
    // Process tickets
    // Remember: The deleted_at value is set ahead of time and determines the future time the thread will be deleted
    // So we get a list of all tickets that have this date in the past
    const S = 'remove';
    const ticketData = await db.user_tickets.findMany({
      where: {
        deleted_at: {
          not: undefined,
          lte: new Date(), // Less than or equal to now
        },
        status: 'ARCHIVED',
      },
    });

    // Loop through each ticket
    if (ticketData.length > 0) {
      // log.debug(F, `[${S}] deleteTicketData: ${JSON.stringify(ticketData.length, null, 2)}`);

      ticketData.forEach(async ticket => {
        // Delete the thread on discord
        let thread = {} as null | Channel;
        try {
          thread = await global.discordClient.channels.fetch(ticket.thread_id);
        } catch (err) {
          // Thread was likely manually deleted
          log.debug(F, `[${S}] Thread ${ticket.thread_id} was likely manually deleted`);
        }

        if (!thread?.isThread()) return;
        log.info(F, `[${S}] Deleting session ${thread.name}`);

        if (thread) {
          await thread.delete('Automatically deleted.');
        } else {
          // log.debug(F, `[${S}] Thread was likely manually deleted`);
        }

        // Update the ticket in the DB
        const updatedTicket = await db.user_tickets.update({
          where: { id: ticket.id },
          data: { status: 'DELETED' as ticket_status },
        });
        log.debug(F, `[${S}] Updated database`);

        await util.sendLogMessage('DELETED', updatedTicket);
        await util.restoreRoles(updatedTicket);
      });
    }
  }

  export async function cleanup() {
    const S = 'cleanup';
    const sessionDataList = await db.session_data.findMany();

    await Promise.all(sessionDataList.map(async sessionData => {
      try {
        const guild = await discordClient.guilds.fetch(sessionData.guild_id);

        if (!guild || !sessionData?.tripsit_channel) return;

        const channel = await guild.channels.fetch(sessionData.tripsit_channel) as TextChannel;
        const missingPerms = await checkChannelPermissions(channel, permissionList.tripsitChannel);

        if (missingPerms.length > 0) return;

        const threadList = await channel.threads.fetch({
          archived: {
            type: 'private',
            fetchAll: true,
          },
        });

        await Promise.all(threadList.threads.map(async thread => {
          try {
            await thread.fetch();
            const messages = await thread.messages.fetch({ limit: 1 });
            const lastMessage = messages.first();
            if (!lastMessage) return;

            if (DateTime.fromJSDate(lastMessage.createdAt) >= DateTime.utc().minus(text.deleteDuration()).minus({ hours: 12 })) {
              const threadData = await db.user_tickets.findFirst({
                where: { thread_id: thread.id },
              });

              if (threadData) {
                await db.user_tickets.update({
                  where: { id: threadData.id },
                  data: {
                    status: 'DELETED' as ticket_status,
                    deleted_at: DateTime.utc().toJSDate(),
                  },
                });

                await util.sendLogMessage('DELETED', threadData);
              }
              await thread.delete();
              // Consider logging outside the loop or summarizing deletions to minimize log entries
            }
          } catch (err) {
            // Handle thread fetch or delete error
          }
        }));
      } catch (err) {
        // Handle guild fetch error or other errors
        if ((err as DiscordErrorData).message === 'GUILD_DELETED') {
          await db.session_data.delete({
            where: { id: sessionData.id },
          });
        }
      }
    }));
  }
}

namespace util {

  export async function restoreRoles(
    ticket: user_tickets,
  ) {
    const S = 'restoreRoles';
    // Restore roles
    const guild = await discordClient.guilds.fetch(ticket.guild_id);
    const userData = await db.users.findFirstOrThrow({
      where: { id: ticket.user_id },
    });
    const member = await guild.members.fetch(userData.discord_id as string);
    if (member) {
      const sessionData = await util.sessionDataInit(ticket.guild_id);

      if (sessionData?.givingRoles) {
        await Promise.all(sessionData.givingRoles.map(async roleId => {
          await member.roles.remove(roleId);
        }));
      }

      if (sessionData?.removingRoles) {
        await Promise.all(sessionData.removingRoles.map(async roleId => {
          await member.roles.add(roleId);
        }));
      }
    }
  }

  export async function needsHelpMode(
    interaction: ModalSubmitInteraction | ButtonInteraction | ChatInputCommandInteraction,
    target: GuildMember,
  ):Promise<void> {
    if (!interaction.guild) return;
    const S = 'needsHelpMode';
    const userData = await db.users.upsert({
      where: { discord_id: target.id },
      create: { discord_id: target.id },
      update: {},
    });
    // Remove roles
    const guild = await discordClient.guilds.fetch(interaction.guild.id);
    const member = await guild.members.fetch(userData.discord_id as string);
    if (member) {
      const sessionData = await util.sessionDataInit(interaction.guild.id);

      if (sessionData?.givingRoles) {
        await Promise.all(sessionData.givingRoles.map(async roleId => {
          await member.roles.add(roleId);
        }));
      }

      if (sessionData?.removingRoles) {
        await Promise.all(sessionData.removingRoles.map(async roleId => {
          await member.roles.remove(roleId);
        }));
      }
      log.info(F, `[${S}] Applied and removed roles to start the session`);
    }
  }

  export async function navMenu(
    page: 'start' | 'help' | 'privacy' | 'setup' | 'stats',
  ):Promise<ActionRowBuilder<ButtonBuilder>> {
    return new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        button.startPage().setStyle(page === 'start' ? ButtonStyle.Success : ButtonStyle.Primary),
        button.helpPage().setStyle(page === 'help' ? ButtonStyle.Success : ButtonStyle.Primary),
        button.privacyPage().setStyle(page === 'privacy' ? ButtonStyle.Success : ButtonStyle.Primary),
        button.setupPage().setStyle(page === 'setup' ? ButtonStyle.Success : ButtonStyle.Primary),
        button.statsPage().setStyle(page === 'stats' ? ButtonStyle.Success : ButtonStyle.Primary),
      );
  }

  export async function setupMenu(
    page: 'setupPageOne' | 'setupPageTwo' | 'setupPageThree',
    interaction: type.TripSitInteraction,
  ):Promise<ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder | StringSelectMenuBuilder | RoleSelectMenuBuilder >[]> {
    if (!interaction.guild) return [];

    const S = 'setupMenu';

    await util.sessionDataInit(interaction.guild.id);

    const setupMenuRow = new ActionRowBuilder<ButtonBuilder>();

    const setupRows: ActionRowBuilder<
    ButtonBuilder
    | ChannelSelectMenuBuilder
    | StringSelectMenuBuilder
    | RoleSelectMenuBuilder >[] = [setupMenuRow];

    setupMenuRow.addComponents(
      button.setupPageOne().setStyle(page === 'setupPageOne' ? ButtonStyle.Success : ButtonStyle.Primary),
      button.setupPageTwo().setStyle(page === 'setupPageTwo' ? ButtonStyle.Success : ButtonStyle.Primary),
      button.setupPageThree().setStyle(page === 'setupPageThree' ? ButtonStyle.Success : ButtonStyle.Primary),
    );

    // Only show the save button if the user has the Manage Channels permission
    // And all of the required setup options are set correctly
    // Otherwise, they can still view the setup options
    if ((interaction.member as GuildMember).permissions.has(PermissionFlagsBits.ManageChannels)
    && global.sessionsSetupData[interaction.guild.id].tripsitChannel && global.sessionsSetupData[interaction.guild.id].tripsitterRoles) {
      const failedPermissions:string[] = [];

      failedPermissions.push(...(await validate.tripsitChannel(interaction)));
      failedPermissions.push(...(await validate.tripsitterRoles(interaction)));
      failedPermissions.push(...(await validate.metaChannel(interaction)));
      failedPermissions.push(...(await validate.giveRemoveRoles(interaction)));
      failedPermissions.push(...(await validate.logChannel(interaction)));

      if (failedPermissions.length === 0) {
        setupMenuRow.addComponents(
          button.save().setStyle(ButtonStyle.Danger),
        );
      }
    }

    const setupOptions = global.sessionsSetupData[interaction.guild.id];

    switch (page) {
      case 'setupPageOne':
        setupRows.push(
          new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            setupOptions.tripsitChannel
              ? select.tripsitChannel().setDefaultChannels(setupOptions.tripsitChannel)
              : select.tripsitChannel(),
          ),
          new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
            setupOptions.tripsitterRoles
              ? select.tripsitterRoles().setDefaultRoles(setupOptions.tripsitterRoles)
              : select.tripsitterRoles().setDefaultRoles(),
          ),
          new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            setupOptions.metaChannel
              ? select.metaChannel().setDefaultChannels(setupOptions.metaChannel)
              : select.metaChannel(),
          ),
        );
        break;
      case 'setupPageTwo':
        setupRows.push(
          new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
            setupOptions.givingRoles
              ? select.givingRoles().setDefaultRoles(setupOptions.givingRoles)
              : select.givingRoles().setDefaultRoles(),
          ),
          new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
            setupOptions.removingRoles
              ? select.removingRoles().setDefaultRoles(setupOptions.removingRoles)
              : select.removingRoles().setDefaultRoles(),
          ),
          new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            setupOptions.logChannel
              ? select.logChannel().setDefaultChannels(setupOptions.logChannel)
              : select.logChannel().setDefaultChannels(),
          ),
        );
        break;
      case 'setupPageThree':
        setupRows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(
          button.updateEmbed(),
        ));
        break;
      default:
        break;
    }

    // This should only ever return 4 rows, because 1 of the 5 rows will be the navigation array
    if (setupRows.length > 4) {
      log.error(F, `${S} setupRows has more than 4 rows! ${setupRows.length}`);
      throw new Error('setupRows has more than 4 rows!');
    }

    return setupRows;
  }

  export async function messageStats(
    message: Message<boolean>,
  ):Promise<void> {
    /* This command is the discord UI for the g.stats command
    Ideas for statistics:
    - How many times each command is used, and by whom
    - How many times people have broken the token game
    - Experience
      - New people to reach X milestone this day/week/month
      - How many people have reached X milestone
      - Changes since last snapshot
      - Send messages when people hit milestones, not just for #vip-lounge
    */

    if (!message.guild) return;
    if (!message.channel) return;
    if (!message.member) return;
    if (message.channel.isDMBased()) return;

    const sessionData = await util.sessionDataInit(message.guild.id);
    if (!sessionData.tripsitChannel) return;

    // Get the thread data
    let ticketData = await db.user_tickets.findFirstOrThrow({
      where: {
        thread_id: message.channel.id,
      },
    });

    // Update the archive/delete times
    ticketData = await db.user_tickets.update({
      where: {
        id: ticketData.id,
      },
      data: {
        archived_at: DateTime.utc().plus(text.deleteDuration()).toJSDate(),
        deleted_at: DateTime.utc().plus(text.archiveDuration()).toJSDate(),
      },
    });

    await session.own(message);
    await session.join(message);
    await util.analyze(message.content, ticketData);
    await util.sendLogMessage('ANALYZE', ticketData, message.member);
  }

  export async function sessionDataInit(
    guildId: string,
  ):Promise<SessionData> {
    let sessionConfig:SessionData = {
      tripsitChannel: null,
      tripsitterRoles: null,
      metaChannel: null,
      givingRoles: null,
      logChannel: null,
      removingRoles: null,
      introMessage: null,
      title: text.title(),
      description: text.description(),
      footer: text.footer(),
      buttonText: text.buttonText(),
      buttonEmoji: text.buttonEmoji(),
    };
    if (!global.sessionsSetupData) {
      // If the global variable doesn't exist, create it
      global.sessionsSetupData = {};
    }

    if (global.sessionsSetupData[guildId]) {
      sessionConfig = global.sessionsSetupData[guildId];
    } else {
      // If there is no session data for this guild, try to pull from database:
      const sessionData = await db.session_data.findFirst({ where: { guild_id: guildId } });

      // If the session data exists, add it to the global variable
      if (sessionData) {
        sessionConfig = {
          tripsitChannel: sessionData.tripsit_channel,
          tripsitterRoles: sessionData.tripsitter_roles,
          metaChannel: sessionData.meta_channel,
          givingRoles: sessionData.giving_roles,
          logChannel: sessionData.log_channel,
          removingRoles: sessionData.removing_roles,
          introMessage: sessionData.intro_message,
          title: sessionData.title,
          description: sessionData.description,
          footer: sessionData.footer,
          buttonText: sessionData.button_text,
          buttonEmoji: sessionData.button_emoji,
        };
        global.sessionsSetupData[guildId] = sessionConfig;
      } else {
        // If the global variable doesn't exist, create it
        global.sessionsSetupData[guildId] = sessionConfig;
      }
    }
    return sessionConfig;
  }

  export async function removeExTeamFromThreads(
    newMember: GuildMember,
    role: Role,
  ) {
    if (!newMember.guild) return;
    const S = 'removeExTeamFromThreads';
    await util.sessionDataInit(newMember.guild.id);

    const sessionData = await util.sessionDataInit(newMember.guild.id);

    // If sessions are setup, and the role removed was a helper/tripsitter role, we need to remove them from threads they are in
    // When you remove a role from someone already invited to a private thread, they can still access the thread if they can access the channel
    // Since @everyone will have access to the #tripsit channel, where threads are created, we need to manually remove them from the thread
    if (sessionData?.tripsitChannel && sessionData.tripsitterRoles?.includes(role.id)) {
      log.debug(F, `[${S}] ${newMember.displayName} had the ${role.name} role removed, which is a tripsitter role!`);
      const userData = await db.users.upsert({
        where: { discord_id: newMember.user.id },
        create: { discord_id: newMember.user.id },
        update: {},
      });

      // Get the user's most recent ticket, if they have one
      const ticketData = await db.user_tickets.findFirst({
        where: {
          user_id: userData.id,
          status: {
            not: {
              in: ['CLOSED', 'RESOLVED', 'DELETED'],
            },
          },
        },
      });

      // Get a list of all the threads in the tripsitting channel
      const channelTripsit = await discordClient.channels.fetch(sessionData.tripsitChannel) as TextChannel;
      const fetchedThreads = await channelTripsit.threads.fetch();

      // For each of those threads, remove the user from the thread
      await Promise.all(fetchedThreads.threads.map(async thread => {
        // If the thread e
        if (thread.id !== ticketData?.thread_id) {
          log.debug(F, `[${S}] Removing ${newMember.displayName} from ${thread.name}`);
          await thread.members.remove(newMember.id, 'Helper/Tripsitter role removed');

          // Find the status of the thread we just removed the user from, and if it's already in ARCHIVED status, we need to re-archive it
          const isArchived = await db.user_tickets.findFirst({
            where: {
              thread_id: thread.id,
              status: 'ARCHIVED',
            },
          });

          if (isArchived) {
            await thread.setArchived(true, 'Helper/Tripsitter role removed');
          }
        }
      }));
    }
  }

  export async function sendLogMessage(
    action: type.TripSitAction,
    ticket: user_tickets,
    actor?: GuildMember,
  ):Promise<void> {
    const sessionData = await util.sessionDataInit(ticket.guild_id);

    const S = 'sendLogMessage';

    if (!sessionData.logChannel && !sessionData.metaChannel) return;

    const guild = await discordClient.guilds.fetch(ticket.guild_id);

    const targetData = await db.users.findFirstOrThrow({
      where: { id: ticket.user_id },
    });
    const target = await guild.members.fetch(targetData.discord_id as string);

    const actorData = actor ? await db.users.findFirstOrThrow({
      where: { discord_id: actor.id },
    }) : null;

    // const thread = await target.guild.channels.fetch(ticket.thread_id) as ThreadChannel;

    const serverAvgOwnedTime = `${guild.name}'s avg first response: ${(await statistic.avgOwnedTime(guild.id, 'TRIPSIT'))}`;
    const serverAvgResolvedTime = `${guild.name}'s avg resolution: ${(await statistic.avgResolveTime(guild.id, 'TRIPSIT'))}`;
    const serverAvgCloseTime = `${guild.name}'s avg closure: ${(await statistic.avgCloseTime(guild.id, 'TRIPSIT'))}`;
    const serverAvgArchiveTime = `${guild.name}'s avg archive: ${(await statistic.avgArchiveTime(guild.id, 'TRIPSIT'))}`;
    const serverAvgDeleteTime = `${guild.name}'s avg delete: ${(await statistic.avgDeleteTime(guild.id, 'TRIPSIT'))}`;
    const serverTicketCount = `${guild.name} total tickets: ${await statistic.totalTickets(target.guild.id, 'TRIPSIT')} tickets in total.`;

    const targetAvgOwnedTime = `<@${target.id}>'s avg first response: ${(await statistic.avgOwnedTime(guild.id, 'TRIPSIT', targetData.id))}`;
    const targetAvgResolvedTime = `<@${target.id}>'s avg resolution: ${(await statistic.avgResolveTime(guild.id, 'TRIPSIT', targetData.id))}`;
    const targetAvgCloseTime = `<@${target.id}>'s avg closure: ${(await statistic.avgCloseTime(guild.id, 'TRIPSIT', targetData.id))}`;
    const targetAvgArchiveTime = `<@${target.id}>'s avg archive: ${(await statistic.avgArchiveTime(guild.id, 'TRIPSIT', targetData.id))}`;
    const targetAvgDeleteTime = `<@${target.id}>'s avg delete: ${(await statistic.avgDeleteTime(guild.id, 'TRIPSIT', targetData.id))}`;
    const targetTicketCount = `<@${target.id}>'s total tickets opened: ${await statistic.totalTickets(target.guild.id, 'TRIPSIT', targetData.id)}`;

    let actorOwnedCount = '';
    let actorAvgOwnedTime = '';
    let actorAvgResolvedTime = '';
    let actorResolvedCount = '';
    let actorSessionCount = '';
    let actorMessageCount = '';

    if (actor && actorData) {
      actorAvgOwnedTime = `<@${actor.id}>'s avg first response: ${(await statistic.avgFirstResponse(guild.id, 'TRIPSIT', actorData.id))}`;
      actorOwnedCount = `<@${actor.id}>'s total first responses: ${await statistic.totalFirstResponse(guild.id, 'TRIPSIT', actorData.id)} time(s).`;

      actorAvgResolvedTime = `<@${actor.id}>'s avg resolution: ${(await statistic.avgResolutionClick(guild.id, 'TRIPSIT', actorData.id))}`;
      actorResolvedCount = `<@${actor.id}>'s total resolved sessions: ${await statistic.totalResolutionClick(guild.id, 'TRIPSIT', actorData.id)} sessions so far.`;

      actorSessionCount = `<@${actor.id}>'s total sessions participated in: ${await statistic.userParticipationSessions(guild.id, 'TRIPSIT', actorData.id)}.`;
      actorMessageCount = `<@${actor.id}>'s total messages in all sessions: ${await statistic.userParticipationMessages(guild.id, 'TRIPSIT', actorData.id)}.`;
    }

    const sessionSummary = await statistic.sessionSummary(ticket, target);
    // log.debug(F, `[${S}] sessionSummary: ${sessionSummary}`);

    const participantList = await statistic.participantList(ticket.id);

    const archiveStr = `If no one talks, it will be archived after ${Object.values(text.archiveDuration())[0]} ${Object.keys(text.archiveDuration())[0]} ${time(ticket.archived_at, 'R')}.`;
    const deleteStr = `If no one talks, it will be deleted after ${Object.values(text.deleteDuration())[0]} ${Object.keys(text.deleteDuration())[0]} ${time(ticket.deleted_at, 'R')}.`;

    const actionDef = text.actionDefinition(action);

    // We initialize these here because certain functions will overwrite it completely below (Delete, archive)
    let intro = `${actionDef.emoji} <@${target.id}>'s <#${(ticket.thread_id)}> was ${actionDef.verb} by <@${actor?.id}> after ${DateTime.utc().diff(DateTime.fromJSDate(ticket.created_at)).toFormat('hh:mm:ss')}`;
    // Body is only used in the Meta channel
    let body = stripIndents`
      ${ticket.description}
      ${sessionSummary}
      ${participantList}
    `;
    // Stats are only used in the Log channel
    let stats = '';
    let outro = '';
    switch (action) {
      case 'OPEN':
        intro = `${actionDef.emoji} **<@${target.id}>** requested help in <#${ticket.thread_id}>`;
        stats = stripIndents`
          ${targetTicketCount}
          ${targetAvgResolvedTime}
          ${targetAvgCloseTime}
          ${targetAvgArchiveTime}
          ${targetAvgDeleteTime}
          
          ${serverTicketCount}
          ${serverAvgResolvedTime}
          ${serverAvgCloseTime}
          ${serverAvgArchiveTime}
          ${serverAvgDeleteTime}
        `;

        break;
      case 'OWNED': {
        stats = stripIndents`
          ${targetAvgOwnedTime}
          ${serverAvgOwnedTime}

          ${actorAvgOwnedTime}
          ${actorOwnedCount}
          ${actorSessionCount}
          ${actorMessageCount}
        `;

        break;
      }
      case 'JOINED':
        stats = stripIndents`
          ${actorSessionCount}
          ${actorMessageCount}
        `;
        break;
      // case 'BLOCKED':
      //   intro += `**<@${target.id}>** has been blocked in <#${ticket.thread_id}>`;
      //   break;
      // case 'PAUSED':
      //   intro += `<@${target.id}>'s ticket in <#${(ticket.thread_id)}> was closed after ${DateTime.utc().diff(DateTime.fromJSDate(ticketData.created_at)).toFormat('hh:mm:ss')}`;
      //   break;
      case 'RESOLVED':
        stats = stripIndents`
          ${targetAvgResolvedTime}
          ${serverAvgResolvedTime}

          ${actorAvgResolvedTime}
          ${actorResolvedCount}
        `;
        outro += `I sent the "I'm good" button to <#${ticket.thread_id}>`;
        break;
      case 'CLOSED':
        stats = stripIndents`
          ${targetAvgCloseTime}
          ${serverAvgCloseTime}
        `;
        outro += stripIndents`
          ${archiveStr}
        `;
        break;
      case 'ARCHIVED':
        intro = `${actionDef.emoji} <@${target.id}>'s ticket was ${actionDef.verb} after ${DateTime.utc().diff(DateTime.fromJSDate(ticket.created_at)).toFormat('hh:mm:ss')}`;
        stats = stripIndents`
          ${targetAvgArchiveTime}
          ${serverAvgArchiveTime}
        `;
        outro += stripIndents`
          ${deleteStr}
        `;
        break;
      case 'REOPENED':
        break;
      case 'DELETED':
        intro = `${actionDef.emoji} <@${target.id}>'s ticket was ${actionDef.verb} after ${DateTime.utc().diff(DateTime.fromJSDate(ticket.created_at)).toFormat('hh:mm:ss')}`;
        body = stripIndents`
          ${participantList}
        `;
        stats = stripIndents`
          ${targetAvgDeleteTime}
          ${serverAvgDeleteTime}
        `;
        break;
      default:
        break;
    }

    // Send a message to the log room
    if (sessionData.logChannel && action !== 'ANALYZE') {
      let channel = {} as TextChannel;
      try {
        channel = await guild.channels.fetch(sessionData.logChannel) as TextChannel;
      } catch (err) {
      // log.debug(F, `[${S}] There was an error fetching the meta channel, it was likely deleted:\n ${err}`);
      }
      if (!channel) return;

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(actionDef.color)
            .setDescription(stripIndents`
              ${intro}
  
              ${stats}
  
              ${outro}
            `),
        ],
      });
    }

    // Update the message in the meta room
    if (sessionData.metaChannel) {
      let channel = {} as TextChannel;
      try {
        channel = await guild.channels.fetch(sessionData.metaChannel) as TextChannel;
      } catch (err) {
      // log.debug(F, `[${S}] There was an error fetching the meta channel, it was likely deleted:\n ${err}`);
      }
      if (!channel) return;

      const metaMessageDesc = stripIndents`
        ${intro}
        ${body}

        ${outro}
      `;

      if (ticket.meta_message_id) {
        try {
          const message = await channel.messages.fetch(ticket.meta_message_id);
          if (message) {
            await message.edit({
              embeds: [
                new EmbedBuilder()
                  .setColor(actionDef.color)
                  .setDescription(metaMessageDesc),
              ],
            });
          } else {
            throw new Error('Message not found');
          }
        } catch (err) {
          const meteMessage = await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(actionDef.color)
                .setDescription(metaMessageDesc),
            ],
          });
          await db.user_tickets.update({
            where: { id: ticket.id },
            data: { meta_message_id: meteMessage.id },
          });
        }
      } else {
        const meteMessage = await channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(actionDef.color)
              .setDescription(metaMessageDesc),
          ],
        });
        await db.user_tickets.update({
          where: { id: ticket.id },
          data: { meta_message_id: meteMessage.id },
        });
      }
    }
  }

  export async function tripsitmeBackup(
    interaction: ButtonInteraction,
  ) {
    await interaction.deferReply({ ephemeral: true });
    // log.debug(F, `[${S}] tripsitmeBackup`);
    if (!interaction.guild) {
      // log.debug(F, `[${S}] no guild!`);
      await interaction.editReply(text.guildOnly());
      return;
    }
    if (!interaction.channel) {
      // log.debug(F, `[${S}] no channel!`);
      await interaction.editReply('This must be performed in a channel!');
      return;
    }
    const userId = interaction.customId.split('~')[1];
    const actor = interaction.member as GuildMember;
    const target = await interaction.guild.members.fetch(userId);

    const userData = await db.users.upsert({
      where: {
        discord_id: userId,
      },
      create: {
        discord_id: userId,
      },
      update: {},
    });

    const ticketData = await db.user_tickets.findFirst({
      where: {
        user_id: userData.id,
        status: {
          not: {
            in: ['CLOSED', 'RESOLVED', 'DELETED'],
          },
        },
      },
    });

    if (!ticketData) {
      // log.debug(F, `[${S}] target ${target} does not need help!`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.DarkBlue)
            .setDescription(`Hey ${interaction.member}, ${target.displayName} does not have an open session!`),
        ],
      });
      return;
    }

    const guildData = await db.discord_guilds.upsert({
      where: {
        id: interaction.guild?.id,
      },
      create: {
        id: interaction.guild?.id,
      },
      update: {},
    });

    let backupMessage = 'Hey ';
    // Get the roles we'll be referencing
    let roleTripsitter = {} as Role;

    const sessionData = await util.sessionDataInit(interaction.guild.id);
    if (sessionData?.tripsitterRoles) {
      await Promise.all(sessionData.tripsitterRoles.map(async roleId => {
        try {
          roleTripsitter = await interaction.guild?.roles.fetch(roleId) as Role;
          backupMessage += `<@&${roleTripsitter.id}> `;
        } catch (err) {
          // log.debug(F, `[${S}] Role ${roleId} was likely deleted`);
        }
      }));
    }

    backupMessage += stripIndents`team, ${actor} has indicated they could use some backup!
      
    Be sure to read the log so you have the context!`;

    await interaction.channel.send(backupMessage);

    await interaction.editReply({ content: 'Backup message sent!' });
  }

  export async function startSession(
    interaction: ButtonInteraction,
  ) {
    if (!interaction.guild) return;

    log.info(F, await commandContext(interaction));

    const S = 'startSession';

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    const failedPermissions:string[] = [];

    failedPermissions.push(...(await validate.tripsitChannel(interaction)));
    failedPermissions.push(...(await validate.tripsitterRoles(interaction)));
    failedPermissions.push(...(await validate.metaChannel(interaction)));
    failedPermissions.push(...(await validate.giveRemoveRoles(interaction)));
    failedPermissions.push(...(await validate.logChannel(interaction)));

    if (!sessionData || failedPermissions.length > 0) {
      await interaction.reply({
        content: 'There is a problem with the setup! Ask the admin to re-run `/tripsit setup!`',
        ephemeral: true,
      });
      return;
    }

    // The target will usually be the person who clicked the button
    // But if the user came in via /tripsit start, and they're also a tripsitter, they can start a session for someone else
    // So we need to check if the `tripsit~sessionUser` component is present, and if so, if it has a selection
    let target = interaction.member as GuildMember;
    const userSelectMenu = getComponentById(interaction, 'tripsit~sessionUser') as UserSelectMenuComponent;
    if (userSelectMenu) {
      const targetId = userSelectMenu.customId.split('~')[2];
      log.debug(F, `[${S}] targetId: ${targetId}`);
      if (targetId && targetId !== target.id) {
        try {
          target = await interaction.guild.members.fetch(targetId);
        } catch (err) {
          log.error(F, `[${S}] Error fetching target: ${err}`);
          await interaction.reply('There was an error fetching the target user!');
          return;
        }
      }
    }
    log.info(F, `[${S}] Target: ${target.displayName} (${target.id})`);

    const userData = await db.users.upsert({
      where: { discord_id: target.id },
      create: { discord_id: target.id },
      update: {},
    });
    // log.debug(F, `[${S}] Target userData: ${JSON.stringify(userData, null, 2)}`);

    const ticketData = await db.user_tickets.findFirst({
      where: {
        user_id: userData.id,
        status: {
          not: {
            in: ['DELETED'],
          },
        },
      },
    });

    if (ticketData) {
      await session.reopen(interaction, target, ticketData);
      return;
    }
    log.info(F, `[${S}] No open ticket found, starting new session`);

    await session.create(interaction, target, userData);
  }

  export async function setupSave(
    interaction: ButtonInteraction,
  ): Promise<InteractionEditReplyOptions> {
    if (!interaction.guild || !interaction.member || !interaction.channel || interaction.channel.isDMBased()) return { content: text.guildOnly() };

    log.info(F, await commandContext(interaction));

    const S = 'setupSave';

    // Initialize data to be used
    const sessionData = await util.sessionDataInit(interaction.guild.id);
    // The following should not happen because the Save button only appears when the setup is complete
    // This is mostly for type-safety
    if (!sessionData.tripsitChannel) return { content: 'No TripSit Channel set!' };

    // Check if the intro_message has already been sent, and if so, update it with the newest info
    let introMessageUpdated = false;
    let introMessage = {} as Message;
    if (sessionData.introMessage) {
      log.debug(F, `[${S}] introMessage ID: ${sessionData.introMessage}`);
      const channelTripsit = await interaction.guild.channels.fetch(sessionData.tripsitChannel) as GuildTextBasedChannel;

      log.debug(F, `[${S}] channelTripsit: ${channelTripsit.name}`);

      try {
        introMessage = await channelTripsit.messages.fetch(sessionData.introMessage) as Message;
        log.debug(F, `[${S}] fetched message record`);
        // Update the message with the newest info

        await introMessage.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle(sessionData.title)
              .setFooter({ text: sessionData.footer })
              .setDescription(sessionData.description)
              .setColor(Colors.Blue),
          ],
          components: [
            new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                button.startSession().setLabel(sessionData.buttonText).setEmoji(sessionData.buttonEmoji),
              ),
          ],
        });
        introMessageUpdated = true;
        log.debug(F, `[${S}] introMessage updated`);
      } catch (err) {
        log.error(F, `[${S}] Error updating intro message`);
        const guildData = await db.discord_guilds.upsert({
          where: { id: interaction.guild.id },
          create: { id: interaction.guild.id },
          update: {},
        });
        const existingSessionData = await db.session_data.findFirst({ where: { guild_id: guildData.id } });
        if (existingSessionData) {
          await db.session_data.update({
            where: { id: existingSessionData.id },
            data: { intro_message: undefined },
          });
        } else {
          log.error(F, `[${S}] Error updating intro message, and i couldn't remove it from the db: ${err}`);
        }
      }
    }

    if (!introMessageUpdated) {
    // Send the message with the button to the tripsit room
      const channelTripsit = await interaction.guild.channels.fetch(sessionData.tripsitChannel) as GuildTextBasedChannel;
      // We need to send the message, otherwise it has the "user used /tripsit setup" at the top
      introMessage = await channelTripsit.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(sessionData.title)
            .setFooter({ text: sessionData.footer })
            .setDescription(sessionData.description)
            .setColor(Colors.Blue),
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              button.startSession(),
            ),
        ],
      });
      sessionData.introMessage = introMessage.id;
      log.debug(F, `[${S}] Sent new intro message in ${channelTripsit.name}`);
    }

    let description = stripIndents`
      I created a button in <#${sessionData.tripsitChannel}> that users can click to get help.
      This is also where I will create new private threads. 
    `;

    if (sessionData.givingRoles || sessionData.removingRoles) {
      if (sessionData.givingRoles) {
        const givingRolesList = sessionData.givingRoles?.map(roleId => `<@&${roleId}>`).join(', ') ?? 'None';
        description += `
          I will give users who need help the ${givingRolesList} role(s).
        `;
      }
      if (sessionData.removingRoles) {
        const removingRolesList = sessionData.removingRoles?.map(roleId => `<@&${roleId}>`).join(', ') ?? 'None';
        description += `
          I will remove the ${removingRolesList} role(s) from users who need help.
        `;
      }
    }

    if (sessionData.metaChannel) {
      // Send the message with the button to the meta tripsit room
      const channelMetaTripsit = await interaction.guild.channels.fetch(sessionData.metaChannel) as GuildTextBasedChannel;
      // We need to send the message, otherwise it has the "user used /tripsit setup" at the top
      await channelMetaTripsit.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('Welcome to TripSit Sessions!')
            .setDescription('This channel will be used to coordinate tripsitting efforts.')
            .setColor(Colors.Blue),
        ],
      });

      description += `
        I will use <#${channelMetaTripsit.id}> to coordinate tripsitting efforts.
      `;
    }

    if (sessionData.logChannel) {
      // Send the message with the button to the meta tripsit room
      const channelLogTripsit = await interaction.guild.channels.fetch(sessionData.logChannel) as GuildTextBasedChannel;
      // We need to send the message, otherwise it has the "user used /tripsit setup" at the top
      await channelLogTripsit.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('Logging channel initialized!')
            .setDescription(stripIndents`Logging initialized for ${interaction.guild.name}!`)
            .setColor(Colors.Blue),
        ],
      });

      description += stripIndents`
        I will use <#${channelLogTripsit.id}> to log tripsitting statistics.
      `;
    }

    const guildData = await db.discord_guilds.upsert({
      where: { id: interaction.guild.id },
      create: { id: interaction.guild.id },
      update: {},
    });
    const userData = await db.users.upsert({
      where: { discord_id: interaction.user.id },
      create: { discord_id: interaction.user.id },
      update: {},
    });

    // Save this info to the DB
    // This runs after the message is sent because we need to update the session_data table with the message ID
    const sessionDataUpdate = {
      guild_id: guildData.id,
      tripsit_channel: sessionData.tripsitChannel,
      tripsitter_roles: sessionData.tripsitterRoles ?? [],
      meta_channel: sessionData.metaChannel,
      log_channel: sessionData.logChannel,
      giving_roles: sessionData.givingRoles ?? [],
      removing_roles: sessionData.removingRoles ?? [],
      title: sessionData.title,
      description: sessionData.description,
      footer: sessionData.footer,
      intro_message: sessionData.introMessage,
      button_emoji: sessionData.buttonEmoji,
      button_text: sessionData.buttonText,
      created_by: userData.id,
      created_at: new Date(),
      updated_by: userData.id,
      updated_at: new Date(),
    } as Omit<session_data, 'id'>;

    const existingSessionData = await db.session_data.findFirst({ where: { guild_id: guildData.id } });
    if (existingSessionData) {
      await db.session_data.update({
        where: { id: existingSessionData.id },
        data: sessionDataUpdate,
      });
    } else {
      await db.session_data.create({
        data: sessionDataUpdate,
      });
    }
    log.debug(F, `[${S}] saved sessiondata to db: ${JSON.stringify(sessionDataUpdate, null, 2)})`);

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Setup ${existingSessionData ? 'Updated' : 'Saved'}`)
          .setDescription(description),
      ],
      components: [
        await util.navMenu('setup'),
      ],
    };
  }

  export async function analyze(
    message: string,
    ticketData: user_tickets,
  ) {
    /* This function handles analyzing hte conversation
    First it will preprocess the text to be stored int he database:
      Tokenization: Breaking down the text into sentences or words.
      Normalization: Lowercasing, removing punctuation, and possibly correcting spelling errors.
      Stop Words Removal: Eliminating common words that add little semantic value (e.g., "the", "is").
      Stemming/Lemmatization: Reducing words to their base or root form (e.g., "running" to "run").
    * Which drug(s) is(are) being discussed.
    * A list of keywords
    * Sentiment analysis
    * Discussion summary
    */
    const S = 'analyze';

    // Lowercase the entire message
    const messageStr:string = message.toLowerCase();
    if (!messageStr || messageStr.length === 9) return;
    log.debug(F, `[${S}] messageStr: ${messageStr}`);

    // Check spelling
    // Loop through each word and check the spelling
    // const correctedSpelling:string = messageNoPunctuation
    //   .split(' ')
    //   .map(word => {
    //     if (!spellcheck.isCorrect(word)) {
    //       const correction = spellcheck.getCorrections(word, 1)[0];
    //       log.debug(F, `[${S}] word: ${word} correction: ${correction}`);
    //       return spellcheck.getCorrections(word, 1)[0];
    //     }
    //     return word;
    //   })
    //   .join(' ');

    // Send the message to openAI for analysis
    const model = {
      name: 'SessionTranslator',
      public: false,
      ai_model: 'GPT_3_5_TURBO' as ai_model,
      prompt: `
        You are acting as spell checking and language processing API. 
        You will receive a message from someone who is in a help session with a tripsitter.
        The person talking may be under the influence of drugs.
        Your job is to correct the spelling and grammar of the message.
        Your response should contain ONLY EVER the corrected message.
        If you are unsure about what was said, return "Undefined" instead of clarifying with the user.
        You will never be able to talk to the user so do not ask them questions.
      `,
      temperature: 0.5,
      presence_penalty: 0,
      frequency_penalty: 0,
      max_tokens: 500,
    };
    const translatorPersona = await db.ai_personas.upsert({
      where: {
        name: model.name,
      },
      create: {
        ...model,
        created_by: ticketData.user_id,
        created_at: DateTime.utc().toJSDate(),
      },
      update: model,
    });

    const translation = await aiFlairMod(translatorPersona, [{
      role: 'user',
      content: messageStr,
    }]);
    log.debug(F, `[${S}] translationResponse: ${translation.response}`);

    // Remove punctuation
    const punctuation:RegExp = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g;
    const messageNoPunctuation:string = translation.response.replace(punctuation, '');
    // log.debug(F, `[${S}] messageNoPunctuation: ${messageNoPunctuation}`);

    const tokenized = tokenizer.tokenize(messageNoPunctuation);
    if (!tokenized || tokenized.length === 0) return;

    // const stemmed = PorterStemmer.stem(messageNoPunctuation);
    // const stopwordsRemoved = stopword.removeStopwords(tokenized);

    // Remove stopwords, tokenize, and stem the message
    // const tokens = PorterStemmer.tokenizeAndStem(messageNoPunctuation, false);

    // Get a list of unique tokens
    // const uniqueTokens = [...new Set([...ticketData.wordTokens, ...tokenized])];
    // log.debug(F, `[${S}] uniqueTokens: ${uniqueTokens}`);

    const allTokens = [...ticketData.wordTokens, ...tokenized];
    // log.debug(F, `[${S}] allTokens: ${allTokens}`);

    // Update the DB
    await db.user_tickets.update({
      where: {
        id: ticketData.id,
      },
      data: {
        wordTokens: allTokens,
      },
    });
  }
}

namespace statistic {
  export async function avgOwnedTime(
    guildId: string,
    ticketType: ticket_type,
    userId?: string,
  ):Promise<string> {
    const where = {
      guild_id: guildId,
      type: ticketType,
      first_response_by: {
        not: null,
      },
      first_response_at: {
        not: null,
      },
    } as {
      guild_id: string;
      type: ticket_type;
      first_response_by: {
        not: null;
      };
      first_response_at: {
        not: null;
      };
      user_id?: string;
    };

    if (userId) where.user_id = userId;

    // log.debug(F, `[${S}] guildId: ${guildId} type: ${type} userId: ${userId}`);
    // Determine average first response time
    const tickets = await db.user_tickets.findMany({
      where,
      orderBy: {
        created_at: 'asc',
      },
      select: {
        first_response_at: true,
        created_at: true,
      },
    });

    // log.debug(F, `[${S}] tickets: ${tickets.length}`);

    if (tickets.length === 0) {
      return Duration.fromObject({ seconds: 0 }).toFormat('hh:mm:ss');
    }

    // Calculate differences in milliseconds and filter out invalid entries
    const durations: number[] = tickets
      .map(ticket => {
        if (ticket.first_response_at && ticket.created_at) {
          return DateTime.fromJSDate(ticket.first_response_at)
            .diff(DateTime.fromJSDate(ticket.created_at), 'seconds')
            .as('seconds'); // Get difference in seconds
        }
        return null;
      })
      .filter(diff => diff !== null) as number[]; // Filter out tickets where calculation was not possible
    // log.debug(F, `[${S}] durations: ${JSON.stringify(durations, null, 2)}`);

    // Calculate average
    const durationAvg = durations.reduce((acc, curr) => acc + curr, 0) / durations.length;
    // log.debug(F, `[${S}] durationAvg: ${durationAvg}`);

    return Duration.fromObject({ seconds: durationAvg }).toFormat('hh:mm:ss');
  }

  export async function avgResolveTime(
    guildId: string,
    ticketType: ticket_type,
    userId?: string,
  ):Promise<string> {
    const where = {
      guild_id: guildId,
      type: ticketType,
      resolved_at: {
        not: undefined,
        lte: new Date(), // Less than or equal to now
      },
    } as {
      guild_id: string;
      type: ticket_type;
      resolved_at: {
        not: undefined;
        lte: Date;
      };
      user_id?: string;
    };

    if (userId) where.user_id = userId;

    // Determine average first response time
    const tickets = await db.user_tickets.findMany({
      where,
      orderBy: {
        created_at: 'asc',
      },
      select: {
        resolved_at: true,
        created_at: true,
      },
    });

    // log.debug(F, `[${S}] tickets: ${tickets.length}`);

    if (tickets.length === 0) {
      return Duration.fromObject({ seconds: 0 }).toFormat('hh:mm:ss');
    }

    // Calculate differences in milliseconds and filter out invalid entries
    const durations: number[] = tickets
      .map(ticket => {
        if (ticket.resolved_at && ticket.created_at) {
          return DateTime.fromJSDate(ticket.resolved_at)
            .diff(DateTime.fromJSDate(ticket.created_at), 'seconds')
            .as('seconds'); // Get difference in seconds
        }
        return null;
      })
      .filter(diff => diff !== null) as number[]; // Filter out tickets where calculation was not possible
    // log.debug(F, `[${S}] durations: ${JSON.stringify(durations, null, 2)}`);

    // Calculate average
    const durationAvg = durations.reduce((acc, curr) => acc + curr, 0) / durations.length;
    // log.debug(F, `[${S}] durationAvg: ${durationAvg}`);

    return Duration.fromObject({ seconds: durationAvg }).toFormat('hh:mm:ss');
  }

  export async function avgCloseTime(
    guildId: string,
    ticketType: ticket_type,
    userId?: string,
  ):Promise<string> {
    const where = {
      guild_id: guildId,
      type: ticketType,
      closed_at: {
        not: undefined,
        lte: new Date(), // Less than or equal to now
      },
    } as {
      guild_id: string;
      type: ticket_type;
      closed_at: {
        not: undefined;
        lte: Date;
      };
      user_id?: string;
    };

    if (userId) where.user_id = userId;

    // Determine average first response time
    const tickets = await db.user_tickets.findMany({
      where,
      orderBy: {
        created_at: 'asc',
      },
      select: {
        closed_at: true,
        created_at: true,
      },
    });

    // log.debug(F, `[${S}] tickets: ${tickets.length}`);

    if (tickets.length === 0) {
      return Duration.fromObject({ seconds: 0 }).toFormat('hh:mm:ss');
    }

    // Calculate differences in milliseconds and filter out invalid entries
    const durations: number[] = tickets
      .map(ticket => {
        if (ticket.closed_at && ticket.created_at) {
          return DateTime.fromJSDate(ticket.closed_at)
            .diff(DateTime.fromJSDate(ticket.created_at), 'seconds')
            .as('seconds'); // Get difference in seconds
        }
        return null;
      })
      .filter(diff => diff !== null) as number[]; // Filter out tickets where calculation was not possible
    // log.debug(F, `[${S}] durations: ${JSON.stringify(durations, null, 2)}`);

    // Calculate average
    const durationAvg = durations.reduce((acc, curr) => acc + curr, 0) / durations.length;
    // log.debug(F, `[${S}] durationAvg: ${durationAvg}`);

    return Duration.fromObject({ seconds: durationAvg }).toFormat('hh:mm:ss');
  }

  export async function avgArchiveTime(
    guildId: string,
    ticketType: ticket_type,
    userId?: string,
  ):Promise<string> {
    const where = {
      guild_id: guildId,
      type: ticketType,
      archived_at: {
        not: undefined,
        lte: new Date(), // Less than or equal to now
      },
    } as {
      guild_id: string;
      type: ticket_type;
      archived_at: {
        not: undefined;
        lte: Date;
      };
      user_id?: string;
    };

    if (userId) where.user_id = userId;

    // Determine average first response time
    const tickets = await db.user_tickets.findMany({
      where,
      orderBy: {
        created_at: 'asc',
      },
      select: {
        archived_at: true,
        created_at: true,
      },
    });

    // log.debug(F, `[${S}] tickets: ${tickets.length}`);

    if (tickets.length === 0) {
      return Duration.fromObject({ seconds: 0 }).toFormat('hh:mm:ss');
    }

    // Calculate differences in milliseconds and filter out invalid entries
    const durations: number[] = tickets
      .map(ticket => {
        if (ticket.archived_at && ticket.created_at) {
          return DateTime.fromJSDate(ticket.archived_at)
            .diff(DateTime.fromJSDate(ticket.created_at), 'seconds')
            .as('seconds'); // Get difference in seconds
        }
        return null;
      })
      .filter(diff => diff !== null) as number[]; // Filter out tickets where calculation was not possible
    // log.debug(F, `[${S}] durations: ${JSON.stringify(durations, null, 2)}`);

    // Calculate average
    const durationAvg = durations.reduce((acc, curr) => acc + curr, 0) / durations.length;
    // log.debug(F, `[${S}] durationAvg: ${durationAvg}`);

    return Duration.fromObject({ seconds: durationAvg }).toFormat('hh:mm:ss');
  }

  export async function avgDeleteTime(
    guildId: string,
    ticketType: ticket_type,
    userId?: string,
  ):Promise<string> {
    const where = {
      guild_id: guildId,
      type: ticketType,
      deleted_at: {
        not: undefined,
        lte: new Date(), // Less than or equal to now
      },
    } as {
      guild_id: string;
      type: ticket_type;
      deleted_at: {
        not: undefined;
        lte: Date;
      };
      user_id?: string;
    };

    if (userId) where.user_id = userId;

    // Determine average first response time
    const tickets = await db.user_tickets.findMany({
      where,
      orderBy: {
        created_at: 'asc',
      },
      select: {
        deleted_at: true,
        created_at: true,
      },
    });
    // log.debug(F, `[${S}] tickets: ${tickets.length}`);

    if (tickets.length === 0) return Duration.fromObject({ seconds: 0 }).toFormat('hh:mm:ss');

    // Calculate differences in milliseconds and filter out invalid entries
    const durations: number[] = tickets
      .map(ticket => {
        if (ticket.deleted_at && ticket.created_at) {
          return DateTime.fromJSDate(ticket.deleted_at)
            .diff(DateTime.fromJSDate(ticket.created_at), 'seconds')
            .as('seconds'); // Get difference in seconds
        }
        return null;
      })
      .filter(diff => diff !== null) as number[]; // Filter out tickets where calculation was not possible
    // log.debug(F, `[${S}] durations: ${JSON.stringify(durations, null, 2)}`);

    // Calculate average
    const durationAvg = durations.reduce((acc, curr) => acc + curr, 0) / durations.length;
    // log.debug(F, `[${S}] durationAvg: ${durationAvg}`);

    return Duration.fromObject({ seconds: durationAvg }).toFormat('hh:mm:ss');
  }

  export async function avgFirstResponse(
    guildId: string,
    ticketType: ticket_type,
    userId: string,
  ):Promise<string> {
    // This will find the average time it takes this user to put in the first response
    const where = {
      guild_id: guildId,
      type: ticketType,
      first_response_by: userId,
      first_response_at: {
        not: null,
      },
    } as {
      guild_id: string;
      type: ticket_type;
      first_response_by: string;
      first_response_at: {
        not: null;
      };
    };

    // log.debug(F, `[${S}] guildId: ${guildId} type: ${type} userId: ${userId}`);
    // Determine average first response time
    const tickets = await db.user_tickets.findMany({
      where,
      orderBy: {
        created_at: 'asc',
      },
      select: {
        first_response_at: true,
        created_at: true,
      },
    });

    // log.debug(F, `[${S}] tickets: ${tickets.length}`);

    if (tickets.length === 0) {
      return Duration.fromObject({ seconds: 0 }).toFormat('hh:mm:ss');
    }

    // Calculate differences in milliseconds and filter out invalid entries
    const durations: number[] = tickets
      .map(ticket => {
        if (ticket.first_response_at && ticket.created_at) {
          return DateTime.fromJSDate(ticket.first_response_at)
            .diff(DateTime.fromJSDate(ticket.created_at), 'seconds')
            .as('seconds'); // Get difference in seconds
        }
        return null;
      })
      .filter(diff => diff !== null) as number[]; // Filter out tickets where calculation was not possible
    // log.debug(F, `[${S}] durations: ${JSON.stringify(durations, null, 2)}`);

    // Calculate average
    const durationAvg = durations.reduce((acc, curr) => acc + curr, 0) / durations.length;
    // log.debug(F, `[${S}] durationAvg: ${durationAvg}`);

    return Duration.fromObject({ seconds: durationAvg }).toFormat('hh:mm:ss');
  }

  export async function totalFirstResponse(
    guildId: string,
    ticketType: ticket_type,
    userId: string,
  ):Promise<number> {
    return db.user_tickets.count({
      where: {
        first_response_by: userId,
        guild_id: guildId,
        type: ticketType,
      },
    });
  }

  export async function avgResolutionClick(
    guildId: string,
    ticketType: ticket_type,
    userId: string,
  ):Promise<string> {
    // This will find the average time it takes this user to click the resolved button
    const where = {
      guild_id: guildId,
      type: ticketType,
      resolved_by: userId,
    } as {
      guild_id: string;
      type: ticket_type;
      resolved_by: string;
    };

    // Determine average first response time
    const tickets = await db.user_tickets.findMany({
      where,
      orderBy: {
        created_at: 'asc',
      },
      select: {
        resolved_at: true,
        created_at: true,
      },
    });

    // log.debug(F, `[${S}] tickets: ${tickets.length}`);

    if (tickets.length === 0) {
      return Duration.fromObject({ seconds: 0 }).toFormat('hh:mm:ss');
    }

    // Calculate differences in milliseconds and filter out invalid entries
    const durations: number[] = tickets
      .map(ticket => {
        if (ticket.resolved_at && ticket.created_at) {
          return DateTime.fromJSDate(ticket.resolved_at)
            .diff(DateTime.fromJSDate(ticket.created_at), 'seconds')
            .as('seconds'); // Get difference in seconds
        }
        return null;
      })
      .filter(diff => diff !== null) as number[]; // Filter out tickets where calculation was not possible
    // log.debug(F, `[${S}] durations: ${JSON.stringify(durations, null, 2)}`);

    // Calculate average
    const durationAvg = durations.reduce((acc, curr) => acc + curr, 0) / durations.length;
    // log.debug(F, `[${S}] durationAvg: ${durationAvg}`);

    return Duration.fromObject({ seconds: durationAvg }).toFormat('hh:mm:ss');
  }

  export async function totalResolutionClick(
    guildId: string,
    ticketType: ticket_type,
    userId?: string,
  ):Promise<number> {
    const where = {
      guild_id: guildId,
      type: ticketType,
    } as {
      guild_id: string;
      type: ticket_type;
      resolved_by?: string;
    };

    if (userId) where.resolved_by = userId;

    return db.user_tickets.count({ where });
  }

  export async function totalTickets(
    guildId: string,
    ticketType?: ticket_type,
    userId?: string,
    status?: ticket_status,
  ):Promise<number> {
    // log.debug(F, `[${S}] guildId: ${guildId} ticketType: ${ticketType} userId: ${userId} status: ${status}`);
    const where = {
      guild_id: guildId,
    } as {
      guild_id: string;
      type?: ticket_type;
      user_id?: string;
      status?: ticket_status;
    };

    if (ticketType) where.type = ticketType;
    if (userId) where.user_id = userId;
    if (status) where.status = status;

    return db.user_tickets.count({ where });
  }

  export async function userParticipationSessions(
    guildId: string,
    ticketType: ticket_type,
    userId: string,
  ):Promise<number> {
    return db.user_ticket_participant.count({
      where: {
        user_id: userId,
        ticket: {
          guild_id: guildId,
          type: ticketType,
        },
      },
    });
  }

  export async function userParticipationMessages(
    guildId: string,
    ticketType: ticket_type,
    userId: string,
  ):Promise<number> {
    const targetParticipation = await db.user_ticket_participant.findMany({
      where: {
        user_id: userId,
        ticket: {
          guild_id: guildId,
          type: ticketType,
        },
      },
      select: {
        ticket_id: true,
        messages: true,
        ticket: {
          select: {
            guild_id: true,
            type: true,
          },
        },
      },
    });

    return targetParticipation.reduce((acc, threadObj) => acc + threadObj.messages, 0);
  }

  export async function avgCsatScore(
    guildId: string,
    ticketType: ticket_type,
    userId?: string,
  ):Promise<number> {
    const where = {
      guild_id: guildId,
      type: ticketType,
      survey_response: { not: null },
    } as {
      guild_id: string;
      type: ticket_type;
      survey_response: {
        not: null;
      };
      user_id?: string;
    };

    if (userId) where.user_id = userId;

    // Determine average first response time
    const tickets = await db.user_tickets.findMany({
      where,
      orderBy: {
        created_at: 'asc',
      },
      select: {
        survey_response: true,
      },
    });
    // log.debug(F, `[${S}] tickets: ${tickets.length}`);

    // Get the average of all survey_response values:

    const scores = tickets
      .map(ticket => ticket.survey_response)
      .filter(score => score !== null) as number[]; // Filter out tickets where calculation was not possible
    // log.debug(F, `[${S}] scores: ${JSON.stringify(scores, null, 2)}`);

    if (scores.length === 0) return 0;

    // Calculate average
    // const scoreAvg = scores.reduce((acc, curr) => acc + curr, 0) / scores.length;
    // log.debug(F, `[${S}] scoreAvg: ${scoreAvg}`);

    return scores.reduce((acc, curr) => acc + curr, 0) / scores.length;
  }

  export async function surveyResponseCount(
    guildId: string,
    ticketType: ticket_type,
    userId?: string,
  ):Promise<number> {
    // Determine average first response time
    const where = {
      guild_id: guildId,
      type: ticketType,
      survey_response: { not: null },
    } as {
      guild_id: string;
      type: ticket_type;
      survey_response: {
        not: null;
      };
      user_id?: string;
    };

    if (userId) where.user_id = userId;

    return db.user_tickets.count({ where });
  }

  export async function participantList(
    ticketId: string,
  ):Promise<string> {
    const participants = await db.user_ticket_participant.findMany({
      where: {
        ticket_id: ticketId,
      },
      select: {
        user_id: true,
        messages: true,
        user: {
          select: {
            discord_id: true,
          },
        },
      },
    });

    return participants
      .map(participant => `<@${participant.user.discord_id}> [${participant.messages}]`)
      .splice(0, 0, '### Thread Participants')
      .join('\n');
  }

  export async function sessionSummary(
    ticketData: user_tickets,
    member: GuildMember,
  ):Promise<string> {
    const S = 'sessionSummary';
    const model = {
      name: 'SessionSummarizer2',
      public: false,
      ai_model: 'GPT_3_5_TURBO' as ai_model,
      prompt: `
        Act as a text summarizer API.
        Create a summary of the text of someone who is in a help session with a tripsitter
        Your response should always be in the third person, referencing the user as "they"
        Prioritize the later tokens over the earlier ones as this is more relevant to the current situation
        Your job is to summarize the conversation as best as you can
        Keep the summary to 2-3 sentences, but don't add fluffy language
        Your response should contain only the summarized message
      `,
      temperature: 0.5,
      presence_penalty: 0,
      frequency_penalty: 0,
      max_tokens: 500,
    };
    const summarizer = await db.ai_personas.upsert({
      where: {
        name: model.name,
      },
      create: {
        ...model,
        created_by: ticketData.user_id,
        created_at: DateTime.utc().toJSDate(),
      },
      update: model,
    });

    const summary = await aiFlairMod(summarizer, [{
      role: 'user',
      content: ticketData.wordTokens.join(' '),
    }]);
    // log.debug(F, `[${S}] summaryResponse: ${summary.response}`);

    return stripIndents`
      ### Current Summary
      ${summary.response.split('\n').map(line => `> ${line}`).join('\n')}
    `;
  }
}

namespace validate {
  export async function tripsitChannel(
    interaction: type.TripSitInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];
    await util.sessionDataInit(interaction.guild.id);

    const channelId = global.sessionsSetupData[interaction.guild.id].tripsitChannel;
    if (!channelId) return ['\n\n**⚠️ No TripSit Channel set! ⚠️**'];

    const channel = await interaction.guild.channels.fetch(channelId) as GuildTextBasedChannel;
    if (!channel) return ['\n\n**⚠️ TripSit Channel not found, try again with another channel! ⚠️**'];

    const missingPerms = await checkChannelPermissions(channel, permissionList.tripsitChannel);

    if (missingPerms.length > 0) {
      return [`\n\n**⚠️ Missing ${missingPerms.join(', ')} permission in <#${channel.id}> ⚠️**`];
    }

    // try {
    //   await interaction.guild.channels.fetch(channelId) as TextChannel;
    // } catch (err) {
    //   const sessionData = await db.session_data.findFirst({ where: { guild_id: interaction.guild.id } })
    //   if (sessionData) {
    //     await db.session_data.update({
    //       where: { id: sessionData.id },
    //       data: { tripsit_channel: undefined },
    //     });interaction.guild.channels.cache.get(c
    //   }
    //   return ['Tripsit channel was deleted, please re-run /tripsit setup!'];
    // }

    return [];
  }

  export async function metaChannel(
    interaction: type.TripSitInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];
    await util.sessionDataInit(interaction.guild.id);

    const channelId = global.sessionsSetupData[interaction.guild.id].metaChannel;
    if (!channelId) return []; // Meta channel is optional

    const channel = await interaction.guild.channels.fetch(channelId) as GuildTextBasedChannel;
    if (!channel) return ['\n\n**⚠️ Meta Channel not found, try again with another channel! ⚠️**'];

    const missingPerms = await checkChannelPermissions(channel, permissionList.metaChannel);

    if (missingPerms.length > 0) {
      return [`\n\n**⚠️ Missing ${missingPerms.join(', ')} permission in <#${channel.id}> ⚠️**`];
    }

    // try {
    //   await interaction.guild.channels.fetch(channelId) as TextChannel;
    // } catch (err) {
    //   const sessionData = await db.session_data.findFirst({ where: { guild_id: interaction.guild.id } })
    //   if (sessionData) {
    //     await db.session_data.update({
    //       where: { id: sessionData.id },
    //       data: { metaChannel: undefined },
    //     });
    //   }
    //   return ['Tripsit meta channel was deleted, please re-run /tripsit setup!'];
    // }

    return [];
  }

  export async function logChannel(
    interaction: type.TripSitInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];
    await util.sessionDataInit(interaction.guild.id);

    const channelId = global.sessionsSetupData[interaction.guild.id].logChannel;
    if (!channelId) return [];

    const channel = await interaction.guild.channels.fetch(channelId) as GuildTextBasedChannel;
    if (!channel) return ['\n\n**⚠️ Log Channel not found, try again with another channel! ⚠️**'];

    const missingPerms = await checkChannelPermissions(channel, permissionList.logChannel);

    if (missingPerms.length > 0) {
      return [`\n\n**⚠️ Missing ${missingPerms.join(', ')} permission in <#${channel.id}> ⚠️**`];
    }

    // try {
    //   await interaction.guild.channels.fetch(channelId) as TextChannel;
    // } catch (err) {
    //   const sessionData = await db.session_data.findFirst({ where: { guild_id: interaction.guild.id } })
    //   if (sessionData) {
    //     await db.session_data.update({
    //       where: { id: sessionData.id },
    //       data: { log_channel: undefined },
    //     });
    //   }
    //   return ['Log channel was deleted, please re-run /tripsit setup!'];
    // }

    return [];
  }

  export async function tripsitterRoles(
    interaction: type.TripSitInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];

    const S = 'tripsitterRoles';

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    const roleIds = sessionData.tripsitterRoles;
    if (!roleIds) return ['\n**⚠️ No Tripsitter Roles set, I wont be able to invite people to private threads! ⚠️**'];

    const roleCheck = await Promise.all(roleIds.map(async roleId => {
      if (!interaction.guild) return text.guildOnly();
      // For each of the tripsitter roles, validate:

      // The role exists
      const role = await interaction.guild?.roles.fetch(roleId);
      if (!role) return `\n**⚠️ ${role} not found, try again with another role! ⚠️**`;

      // Check that the role is mentionable by the bot
      if (!role.mentionable) {
        // If the role isn't mentionable, double check that the bot doesn't have the permission to mention everyone
        const perms = await checkGuildPermissions(interaction.guild, permissionList.mentionEveryone);
        if (perms.length > 0) {
          return `\n**⚠️ The ${role} isn't mentionable, and I don't have the permission to mention them! ⚠️**`;
        }
        log.debug(F, `[${S}] The ${role} isn't mentionable, but I have the permission to mention hidden roles!`);
      }

      return undefined;
    }));

    const filteredResults = roleCheck.filter(role => role !== undefined);

    // log.debug(F, `[${S}] filteredResults: ${filteredResults}`);

    return filteredResults as string[];
  }

  export async function giveRemoveRoles(
    interaction: type.TripSitInteraction,
  ): Promise<string[]> {
    if (!interaction.guild) return [text.guildOnly()];

    const S = 'giveRemoveRoles';

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    // If the bot should give or remove roles, check if the bot has the ManageRoles permission
    // Also check that the provided roles are below the bot's current role
    const { givingRoles } = sessionData;
    const { removingRoles } = sessionData;
    if (givingRoles || removingRoles) {
      const perms = await checkGuildPermissions(interaction.guild, permissionList.guildPermissions);
      if (perms.length > 0) {
        log.error(F, `[${S}] Missing guild permission ${perms.join(', ')} in ${interaction.guild}!`);
        return [`\n\n**⚠️ I need the ${perms.join(', ')} permission in order to give or remove roles! ⚠️**`];
      }

      const myRole = interaction.guild.members.me?.roles.highest;

      // Get a list of all roles that are being added or removed
      const roleIds = [
        ...(givingRoles ?? []),
        ...(removingRoles ?? []),
      ];

      // log.debug(F, `[${S}] roleIds: ${roleIds.join(', ')}`);

      const higherRoles = await Promise.all(
        roleIds.map(async roleId => {
          const role = await interaction.guild?.roles.fetch(roleId);
          // log.debug(F, `[${S}] role: ${JSON.stringify(role, null, 2)}`);

          if (myRole && role && myRole.comparePositionTo(role) < 0) {
            // log.debug(F, `[${S}] myRole.comparePositionTo(role): ${myRole?.comparePositionTo(role)}`);
            return role;
          }
          return undefined;
        }),
      );

      // Filter out 'undefined' values
      const filteredResults = higherRoles.filter((role): role is Role => role !== undefined);

      // log.debug(F, `[${S}] filteredResults: ${filteredResults}`);

      if (filteredResults.length > 0) {
        // log.error(F, `[${S}] The bot's role is not higher than the roles being added in ${interaction.guild.name}!`);
        return [`\n\n**⚠️The bot's role is needs to be higher than the ${filteredResults.join(', ')} role(s)!⚠️**`];
      }

      if (givingRoles && removingRoles) {
        // If both options are supplied, make sure that they don't share any roles
        const sharedRoles = await Promise.all(
          givingRoles.map(async roleId => {
            if (removingRoles.includes(roleId)) {
              return interaction.guild?.roles.fetch(roleId);
            }
            return undefined;
          }),
        );

        // Filter out 'undefined' values
        const filteredShared = sharedRoles.filter((role): role is Role => role !== undefined);

        if (filteredShared.length > 0) {
          return [`\n\n**⚠️The role(s) ${filteredShared.join(', ')} are in both the giving and removing roles!⚠️**`];
        }
      }
    }

    return [];
  }
}

namespace button {
  export function helpPage() {
    return new ButtonBuilder()
      .setCustomId('tripsit~help')
      .setLabel('Help')
      .setEmoji('❓')
      .setStyle(ButtonStyle.Primary);
  }

  export function setupPage() {
    return new ButtonBuilder()
      .setCustomId('tripsit~setup')
      .setLabel('Setup')
      .setEmoji('⚙️')
      .setStyle(ButtonStyle.Primary);
  }

  export function privacyPage() {
    return new ButtonBuilder()
      .setCustomId('tripsit~privacy')
      .setLabel('Privacy')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Primary);
  }

  export function startPage() {
    return new ButtonBuilder()
      .setCustomId('tripsit~startPage')
      .setLabel('Start')
      .setEmoji('🚀')
      .setStyle(ButtonStyle.Primary);
  }

  export function startSession() {
    return new ButtonBuilder()
      .setCustomId('tripsit~startSession')
      .setLabel('I want to talk to a tripsitter!')
      .setEmoji('🚀')
      .setStyle(ButtonStyle.Primary);
  }

  export function statsPage() {
    return new ButtonBuilder()
      .setCustomId('tripsit~stats')
      .setLabel('Stats')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Primary);
  }

  export function setupPageOne() {
    return new ButtonBuilder()
      .setCustomId('tripsit~pageOne')
      .setLabel('Page One')
      .setEmoji('1️⃣')
      .setStyle(ButtonStyle.Primary);
  }

  export function setupPageTwo() {
    return new ButtonBuilder()
      .setCustomId('tripsit~pageTwo')
      .setLabel('Page Two')
      .setEmoji('2️⃣')
      .setStyle(ButtonStyle.Primary);
  }

  export function setupPageThree() {
    return new ButtonBuilder()
      .setCustomId('tripsit~pageThree')
      .setLabel('Page Three')
      .setEmoji('3️⃣')
      .setStyle(ButtonStyle.Primary);
  }

  export function dev() {
    return new ButtonBuilder()
      .setCustomId('tripsit~dev')
      .setLabel('Dev')
      .setEmoji('🛠️')
      .setStyle(ButtonStyle.Primary);
  }

  export function save() {
    return new ButtonBuilder()
      .setCustomId('tripsit~save')
      .setLabel('Save')
      .setEmoji('💾')
      .setStyle(ButtonStyle.Success);
  }

  export function updateEmbed() {
    return new ButtonBuilder()
      .setCustomId('tripsit~updateEmbed')
      .setLabel('Update Embed Text')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Primary);
  }

  export function sessionHardClose(targetId:string) {
    return new ButtonBuilder()
      .setCustomId(`tripsit~hardClose~${targetId}`)
      .setLabel('I\'m good now!')
      .setEmoji('👍')
      .setStyle(ButtonStyle.Success);
  }

  export function sessionSoftClose(targetId:string) {
    return new ButtonBuilder()
      .setCustomId(`tripsit~softClose~${targetId}`)
      .setLabel('Send Close Button')
      .setEmoji('☑️')
      .setStyle(ButtonStyle.Success);
  }

  export function sessionBackup(targetId:string) {
    return new ButtonBuilder()
      .setCustomId(`tripsit~sessionBackup~${targetId}`)
      .setLabel('I need backup')
      .setEmoji('🆘')
      .setStyle(ButtonStyle.Primary);
  }
}

namespace page {
  export async function start(
    interaction: ChatInputCommandInteraction | ButtonInteraction
    | UserSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };

    log.info(F, await commandContext(interaction));

    const S = 'start';

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    const components:ActionRowBuilder<ButtonBuilder | UserSelectMenuBuilder>[] = [
      await util.navMenu('start'),
    ];

    let description = stripIndents`
      Here you  can start a new tripsit session.

      Just click the button below, enter in some details, and we'll create a private thread just for you to talk with our team.
    `;

    // Check if the sessionData has been set up, and if the Tripsitter Roles are provided, and if the user
    // has one of those roles
    if (sessionData.tripsitterRoles) {
      const member = interaction.guild.members.cache.get(interaction.user.id);
      if (member) {
        const hasTripsitterRole = member.roles.cache.some(role => sessionData.tripsitterRoles?.includes(role.id));
        if (hasTripsitterRole) {
          description += `\n\n
            **You have one of the tripsitter roles, and can start on behalf of someone else.**

            If you want to start a session for someone else, select them from the dropdown below, and click the button to start the session.
          `;

          if (interaction.isUserSelectMenu()) {
            log.debug(F, `[${S}] Interaction is user select menu`);
            components.push(
              new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
                select.sessionUser().setCustomId(`tripsit~sessionUser~${interaction.values[0]}`),
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                button.startSession().setLabel('I want them to talk to a tripsitter!'),
              ),
            );
          } else {
            components.push(
              new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
                select.sessionUser(),
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                button.startSession(),
              ),
            );
          }
        } else {
          components.push(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              button.startSession(),
            ),
          );
        }
      }
    }

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Start`)
          .setDescription(description),
      ],
      components,
    };
  }

  export async function help(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };

    return {
      embeds: [
        new EmbedBuilder()
          .setAuthor(null)
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Help`)
          .setDescription(stripIndents`
            Information on TripSit Sessions

            ### ${text.actionDefinition('OPEN').emoji} - Open
            Someone has requested help

            ### ${text.actionDefinition('OWNED').emoji} - Owned
            Someone has responded to their request for help
            A team member triggers this status by talking in the thread.

            ### ${text.actionDefinition('JOINED').emoji} Joined
            More than one person has responded to the request for help.
            A team member triggers this status by talking in the thread after someone else has already started.

            ### ${text.actionDefinition('REOPENED').emoji} Reopened
            The user clicked the "i need help" button after this session was Resolved or Closed.
            A team member can move out of this status by talking in the channel.

            ### ${text.actionDefinition('RESOLVED').emoji} Resolved
            The team thinks they're good and has prompted the user to click the I'm Good button.
            The user can move out of this status by clicking the "I need help" button again.

            ### ${text.actionDefinition('CLOSED').emoji} Closed
            The user clicks the "im good" button and signifies they no longer need help
            After ${Object.values(text.archiveDuration())[0]} ${Object.keys(text.archiveDuration())[0]} this thread will be archived.
            The user can move out of this status by clicking the "I need help" button again, or by talking in the channel.

            ### ${text.actionDefinition('ARCHIVED').emoji} Archived
            Session is archived and pending deletion
            After ${Object.values(text.deleteDuration())[0]} ${Object.keys(text.deleteDuration())[0]} this thread will will be deleted.
            The user can move out of this status by clicking the "I need help" button again, or by talking in the channel.
          `)
          .setFooter(null)],
      components: [
        await util.navMenu('help'),
      ],
    };
  }

  export async function privacy(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Privacy`)
          .setDescription(stripIndents`
            Here we can review your privacy and delete your thread.
          `),
      ],
      components: [
        await util.navMenu('privacy'),
      ],
    };
  }

  export async function setupPageOne(
    interaction: type.TripSitInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member || !interaction.channel || interaction.channel.isDMBased()) return { content: text.guildOnly() };
    // This function will guide the user through setup
    // Discord only allows 5 action rows in an embed, and we're using 1 for the navigation buttons
    // We need another row for the "Save" button, so we only have 3 rows to work with
    // We have 6 options to setup, so we'll need to split it into 2 pages
    // I also added a 'dev' button that will populate it with information that best helps tripsit devs to debug.
    // Setup page is visible to everyone, but only those with ManageChannels permissions can select options

    /* We need to do a bunch of validations to make sure that the inputs are correct:
    TripSit Channel
      View Channel - to see the channel
      Send Messages - to send messages
      Create Private Threads - to create private threads
      Send Messages in Threads - to send messages in threads
      Manage Threads - to delete threads when they're done
      Manage Messages - to pin the "im good" message to the top of the thread
      Double check that @everyone can see this channel
    TripSitter Roles
      Ability to mention? - to ping the roles?
    Meta Channel, if provided
      View Channel - to see the channel
      Send Messages - to send messages
      Create Private Threads - to create private threads, when requested through the bot
      Send Messages in Threads - to send messages in threads
      Manage Threads - to delete threads when they're done
      Double check that the Tripsitter Roles can access this channel, and @everyone can't
    */

    await util.sessionDataInit(interaction.guild.id);

    let description = stripIndents`
      Here we can setup TripSit Sessions in your guild.
      ### Tripsitting Channel
      I will create a button in this channel that users can click to get help.
      I will also create new private threads in this channel.
      This channel should be public to anyone you want to be able to ask for help.
      In order to setup the tripsitting feature I need:
      View Channel - to see the channel
      Send Messages - to send messages
      Create Private Threads - to create private threads
      Send Messages in Threads - to send messages in threads
      Manage Threads - to delete threads when they're done
      Manage Messages - to pin the "im good" message to the top of the thread
      ### Tripsitting Roles
      When the private thread is created, I will ping these roles to invite them to the thread.
      ### Meta Discussion Room (Optional)
      This allows your Tripsitting Roles to coordinate efforts.
      The bot will post when new threads are created, and when they're closed.
      This channel should be private to only your Tripsitting Roles.
      In order to setup the meta channel feature I need:
      View Channel - to see the channel
      Send Messages - to send messages
      Create Private Threads - to create private threads, when requested through the bot
      Send Messages in Threads - to send messages in threads
      Manage Threads - to delete threads when they're done
    `;

    // log.debug(F, `[${S}] setupOptions: ${JSON.stringify(global.sessionsSetupData[interaction.guild.id], null, 2)}`);

    description += await validate.tripsitChannel(interaction);
    description += (await validate.tripsitterRoles(interaction)).join('');
    description += await validate.metaChannel(interaction);

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Setup`)
          .setDescription(description),
      ],
      components: [
        await util.navMenu('setup'),
        ...await util.setupMenu('setupPageOne', interaction),
      ],
    };
  }

  export async function setupPageTwo(
    interaction: type.TripSitInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };
    /* We need to do a bunch of validations to make sure that the inputs are correct:
    Giving Roles
      The bot needs the ManageRoles permission so it can add and remove roles
      Check that the bot's role is higher than all roles being removed or added, otherwise it will error
    Removing Roles
      The bot needs the ManageRoles permission so it can add and remove roles
      Check that the bot's role is higher than all roles being removed or added, otherwise it will error
    Log Channel, if provided
      View Channel - to see the channel
      Send Messages - to send messages
    */

    let description = stripIndents`
      Here we can setup TripSit Sessions in your guild.
      ### Give These Roles (Optional)
      These roles are applied to the person in need of help after they submit their issue.
      This allows your Tripsitting Roles to easily identify who needs help.
      You can also limit access to your server for people with this roles.
      This can make it easier for them to access their help thread when your server has a lot of channels.
      
      In order to give roles to people I need the **Manage Roles** permission.
      My role needs to be higher than all other roles you want removed, so put moderators and admins above me in the list!
      ### Remove These Roles (Optional)
      These roles are removed from the person in need of help after they submit their issue.
      If you have roles that give access to channels, you may need to remove them to clean up the user's UI.
      ### Log Channel (Optional)
      Logging of tripsit session statistics will happen here.
      This is mostly for nerds who want to see how sessions are going.
      In order to setup the log channel feature I need:
      View Channel - to see the channel
      Send Messages - to send messages
    `;

    description += (await validate.giveRemoveRoles(interaction)).join('');
    description += await validate.logChannel(interaction);

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Setup Page Two`)
          .setDescription(description),
      ],
      components: [
        await util.navMenu('setup'),
        ...await util.setupMenu('setupPageTwo', interaction),
      ],
    };
  }

  export async function setupPageThree(
    interaction: type.TripSitInteraction,
  ): Promise<InteractionEditReplyOptions> {
    log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle(`${interaction.guild.name}'s TripSit Sessions Setup Page Three`)
          .setDescription(stripIndents`
          This is where you can setup the button that will be used to start a session.
          ### Title
          > ${sessionData.title}
          ### Description
          ${sessionData.description.split('\n').map(line => `> ${line}`).join('\n')}
          ### Footer
          > ${sessionData.footer}
          ### Button Text
          > ${sessionData.buttonText}
          ### Button Emoji
          > ${sessionData.buttonEmoji}
        `),
      ],
      components: [
        await util.navMenu('setup'),
        ...await util.setupMenu('setupPageThree', interaction),
      ],
    };
  }

  export async function stats(
    interaction: ChatInputCommandInteraction | ButtonInteraction | UserSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };

    log.info(F, await commandContext(interaction));

    const S = 'stats';

    const sessionData = await util.sessionDataInit(interaction.guild.id);

    const components:ActionRowBuilder<ButtonBuilder | UserSelectMenuBuilder>[] = [
      await util.navMenu('stats'),
    ];

    let description = `### ${interaction.guild.name}'s TripSit Sessions Statistics\n\n`;
    let selectedUserId;
    if (interaction.isUserSelectMenu()) {
      const userData = await db.users.upsert({
        where: { discord_id: interaction.values[0] },
        create: { discord_id: interaction.values[0] },
        update: {},
      });
      selectedUserId = userData.id;
      description = `### <@${interaction.values[0]}>'s TripSit Sessions Statistics\n\n`;
    }

    log.debug(F, `[${S}] selectedUserId: ${selectedUserId}`);

    description += stripIndents`
      **Client Satisfaction**
      ${await statistic.avgCsatScore(interaction.guild.id, 'TRIPSIT', selectedUserId)} out of 5 across ${await statistic.avgCsatScore(interaction.guild.id, 'TRIPSIT', selectedUserId)} survey responses.

      **Times**
      ${(await statistic.avgOwnedTime(interaction.guild.id, 'TRIPSIT', selectedUserId))} average first response time.
      ${(await statistic.avgArchiveTime(interaction.guild.id, 'TRIPSIT', selectedUserId))} average time to archive.
      ${(await statistic.avgDeleteTime(interaction.guild.id, 'TRIPSIT', selectedUserId))} average time to delete.

      **Session Counts**
      ${await statistic.totalTickets(interaction.guild.id, 'TRIPSIT', selectedUserId, 'OPEN')} don't have a first response.
      ${await statistic.totalTickets(interaction.guild.id, 'TRIPSIT', selectedUserId, 'OWNED')} engaged with a team member.
      ${await statistic.totalTickets(interaction.guild.id, 'TRIPSIT', selectedUserId, 'RESOLVED')} soft-closed by the team.
      ${await statistic.totalTickets(interaction.guild.id, 'TRIPSIT', selectedUserId, 'CLOSED')} hard-closed by the user.
      ${await statistic.totalTickets(interaction.guild.id, 'TRIPSIT', selectedUserId, 'ARCHIVED')} archived.
      ${await statistic.totalTickets(interaction.guild.id, 'TRIPSIT', selectedUserId, 'DELETED')} deleted.
      ${await statistic.totalTickets(interaction.guild.id, 'TRIPSIT', selectedUserId)} total.
    `;

    if (sessionData.tripsitterRoles) {
      const member = interaction.guild.members.cache.get(interaction.user.id);
      if (member) {
        const hasTripsitterRole = member.roles.cache.some(role => sessionData.tripsitterRoles?.includes(role.id));
        if (hasTripsitterRole) {
          description += `\n
            **You have one of the tripsitter roles, and can look up stats on other users.**
          `;

          if (interaction.isUserSelectMenu()) {
            components.push(
              new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
                select.statsUser().setCustomId(`tripsit~statsUser~${interaction.values[0]}`),
              ),
            );
          } else {
            components.push(
              new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
                select.statsUser(),
              ),
            );
          }
        }
      }
    }

    return {
      embeds: [
        new EmbedBuilder().setDescription(description),
      ],
      components,
    };
  }
}

namespace select {
  export function tripsitChannel() {
    return new ChannelSelectMenuBuilder()
      .setCustomId('tripsit~tripsitChannel')
      .setPlaceholder('Tripsitting Channel')
      .addChannelTypes(ChannelType.GuildText)
      .setMinValues(1)
      .setMaxValues(1);
  }

  export function tripsitterRoles() {
    return new RoleSelectMenuBuilder()
      .setCustomId('tripsit~tripsitterRoles')
      .setPlaceholder('Tripsitting Roles')
      .setMinValues(1)
      .setMaxValues(25);
  }

  export function metaChannel() {
    return new ChannelSelectMenuBuilder()
      .setCustomId('tripsit~metaChannel')
      .setPlaceholder('Meta Discussion Room (Optional)')
      .addChannelTypes(ChannelType.GuildText)
      .setMinValues(0)
      .setMaxValues(1);
  }

  export function logChannel() {
    return new ChannelSelectMenuBuilder()
      .setCustomId('tripsit~logChannel')
      .setPlaceholder('Log Channel (Optional)')
      .addChannelTypes(ChannelType.GuildText)
      .setMinValues(0)
      .setMaxValues(1);
  }

  export function givingRoles() {
    return new RoleSelectMenuBuilder()
      .setCustomId('tripsit~givingRoles')
      .setPlaceholder('Give These Roles (Optional)')
      .setMinValues(0)
      .setMaxValues(25);
  }

  export function removingRoles() {
    return new RoleSelectMenuBuilder()
      .setCustomId('tripsit~removingRoles')
      .setPlaceholder('Remove These Roles (Optional)')
      .setMinValues(0)
      .setMaxValues(25);
  }

  export function sessionUser() {
    return new UserSelectMenuBuilder()
      .setCustomId('tripsit~sessionUser')
      .setPlaceholder('User to start session with (Optional)')
      .setMinValues(0)
      .setMaxValues(1);
  }

  export function statsUser() {
    return new UserSelectMenuBuilder()
      .setCustomId('tripsit~statsUser')
      .setPlaceholder('User to view stats')
      .setMinValues(0)
      .setMaxValues(1);
  }
}

namespace permissionList {
  export const tripsitChannel:PermissionResolvable[] = [
    'ViewChannel',
    'SendMessages',
    'SendMessagesInThreads',
    'CreatePrivateThreads',
    'ManageMessages',
    'ManageThreads',
  ];
  export const guildPermissions:PermissionResolvable[] = [
    'ManageRoles',
  ];
  export const metaChannel:PermissionResolvable[] = [
    'ViewChannel',
    'SendMessages',
    'SendMessagesInThreads',
    'CreatePrivateThreads',
    'ManageThreads',
  ];
  export const logChannel:PermissionResolvable[] = [
    'ViewChannel',
    'SendMessages',
  ];

  export const mentionEveryone:PermissionResolvable[] = [
    'MentionEveryone',
  ];

  export const manageThreads:PermissionResolvable[] = [
    'SendMessages',
    'ManageThreads',
  ];
}

export async function tripsitTimer() {
  // Used in timer.ts
  // Runs every 60 seconds in production
  await session.archive();
  await session.remove();
  // await session.cleanup();
}

export async function tripsitMessage(
  messageData: Message<boolean>,
): Promise<void> {
  // Used in messageCreate.ts
  // Check if the message was sent in a tripsit thread
  const ticketData = await db.user_tickets.findFirst({
    where: {
      thread_id: messageData.channel.id,
    },
  });

  if (!ticketData) return;

  await messageData.fetch();
  await util.messageStats(messageData);
}

export async function tripsitReaction(
  messageReaction: MessageReaction,
  user: User,
): Promise<void> {
  // Used in messageReactionAdd.ts
  if (user.bot) return;
  await messageReaction.fetch();
  await user.fetch();
  if (!messageReaction.message.guild) return; // Ignore DMs

  const reactionEmojiList = [
    text.rateOne(),
    text.rateTwo(),
    text.rateThree(),
    text.rateFour(),
    text.rateFive(),
  ];

  // If this isn't one of the approved emojis, ignore
  if (!reactionEmojiList.includes(messageReaction.emoji.name as string)) return;

  // Get the current threadData from the db
  const threadData = await db.user_tickets.findFirst({
    where: { thread_id: messageReaction.message.channel.id },
  });
  if (!threadData) return;

  if (threadData.survey_response) return;

  const userData = await db.users.upsert({
    where: { discord_id: user.id },
    create: { discord_id: user.id },
    update: {},
  });

  // If the user clicking the reaction is not the thread's user, ignore it
  if (userData.id !== threadData.user_id) {
    const emojiObj = messageReaction.message.reactions.cache.get(messageReaction.emoji.name as string);
    if (emojiObj) {
      await emojiObj.users.remove(user.id);
    }
    return;
  }

  await messageReaction.message.edit({
    content: stripIndents`
    ${emojiGet('Invisible')}
    > Thank you for your feedback, here's a cookie! 🍪
    ${emojiGet('Invisible')}
    `,
  });
  await messageReaction.message.reactions.removeAll();

  const score = reactionEmojiList.indexOf(messageReaction.emoji.name as string) + 1;

  // Add the user's reaction to the db
  await db.user_tickets.update({
    where: { id: threadData.id },
    data: {
      survey_response: score,
    },
  });

  const sessionData = await util.sessionDataInit(messageReaction.message.guild.id);
  if (sessionData.logChannel) {
    const channelLogTripsit = await messageReaction.message.guild.channels.fetch(sessionData.logChannel) as GuildTextBasedChannel;

    const averageCsatScore = await statistic.avgCsatScore(messageReaction.message.guild.id, 'TRIPSIT');
    await channelLogTripsit.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blue)
          .setDescription(stripIndents`
            Collected ${messageReaction.emoji.name} from <@${user.id}>

            The server satisfaction score average is ${averageCsatScore} / 5.
          `),
      ],
    });
  }
}

export async function tripsitSelect(
  interaction: ChannelSelectMenuInteraction | StringSelectMenuInteraction | RoleSelectMenuInteraction | UserSelectMenuInteraction,
): Promise<void> {
  // Used in selectMenu.ts
  if (!interaction.guild) return;
  const menuId = interaction.customId;
  // log.debug(F, `[${S}] menuId: ${menuId}`);
  const [, menuAction] = menuId.split('~') as [
    null,
    /* Setup Options */'tripsitChannel' | 'metaChannel' | 'tripsitterRoles' | 'givingRoles' | 'removingRoles' |
    /* Tripsitting selection */ 'sessionUser' |
    /* Statistic selection */ 'statsUser',
  ];

  await util.sessionDataInit(interaction.guild.id);

  // Save the most recent interaction data to the global  variable
  // We use a global variable so that it persists between interactions, but it's not stored in the db yet
  if (!interaction.isChatInputCommand()) {
    if (interaction.isChannelSelectMenu()) {
      if (interaction.customId === 'tripsit~tripsitChannel') {
        [global.sessionsSetupData[interaction.guild.id].tripsitChannel] = interaction.values;
      }
      if (interaction.customId === 'tripsit~metaChannel') {
        [global.sessionsSetupData[interaction.guild.id].metaChannel] = interaction.values;
      }
      if (interaction.customId === 'tripsit~logChannel') {
        [global.sessionsSetupData[interaction.guild.id].logChannel] = interaction.values;
      }
    }
    if (interaction.isRoleSelectMenu()) {
      if (interaction.customId === 'tripsit~tripsitterRoles') {
        global.sessionsSetupData[interaction.guild.id].tripsitterRoles = interaction.values;
      }
      if (interaction.customId === 'tripsit~givingRoles') {
        global.sessionsSetupData[interaction.guild.id].givingRoles = interaction.values;
      }
      if (interaction.customId === 'tripsit~removingRoles') {
        global.sessionsSetupData[interaction.guild.id].removingRoles = interaction.values;
      }
    }
  }
  // log.debug(F, `[${S}] setupOptionsAfter: ${JSON.stringify(setupOptions, null, 2)}`);

  switch (menuAction) {
    case 'tripsitChannel':
      await interaction.update(await page.setupPageOne(interaction as ChannelSelectMenuInteraction));
      break;
    case 'tripsitterRoles':
      await interaction.update(await page.setupPageOne(interaction as RoleSelectMenuInteraction));
      break;
    case 'metaChannel':
      await interaction.update(await page.setupPageOne(interaction as ChannelSelectMenuInteraction));
      break;
    case 'givingRoles':
      await interaction.update(await page.setupPageTwo(interaction as RoleSelectMenuInteraction));
      break;
    case 'removingRoles':
      await interaction.update(await page.setupPageTwo(interaction as RoleSelectMenuInteraction));
      break;
    case 'sessionUser':
      await interaction.update(await page.start(interaction as UserSelectMenuInteraction));
      break;
    case 'statsUser':
      await interaction.update(await page.stats(interaction as UserSelectMenuInteraction));
      break;
    default:
      await interaction.update({
        content: "I'm sorry, I don't understand that command!",
      });
      break;
  }
}

export async function tripsitButton(
  interaction: ButtonInteraction,
): Promise<void> {
  // Used in buttonClick.ts
  const buttonID = interaction.customId;
  // log.debug(F, `[${S}] buttonID: ${buttonID}`);
  const [, action] = buttonID.split('~') as [
    null,
    /* button actions */ 'backup' | 'softClose' | 'hardClose' | 'startSession' | 'updateEmbed' |
    /* page buttons */ 'startPage' | 'privacy' | 'help' | 'setup' | 'stats' | 'pageOne' | 'pageTwo' | 'pageThree' | 'dev' | 'save',
  ];

  if (!interaction.guild) return;
  if (!interaction.member) return;
  if (!interaction.channel) return;

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (action) {
    case 'backup':
      await util.tripsitmeBackup(interaction);
      break;
    case 'softClose':
      await session.resolve(interaction);
      break;
    case 'hardClose':
      await session.close(interaction);
      break;
    case 'startSession':
      await util.startSession(interaction);
      break;
    case 'startPage':
      await interaction.update(await page.start(interaction));
      break;
    case 'privacy':
      await interaction.update(await page.privacy(interaction));
      break;
    case 'help':
      await interaction.update(await page.help(interaction));
      break;
    case 'setup':
      await interaction.update(await page.setupPageOne(interaction));
      break;
    case 'stats':
      await interaction.update(await page.stats(interaction));
      break;
    case 'pageOne':
      await interaction.update(await page.setupPageOne(interaction));
      break;
    case 'pageTwo':
      await interaction.update(await page.setupPageTwo(interaction));
      break;
    case 'pageThree':
      await interaction.update(await page.setupPageThree(interaction));
      break;
    case 'save':
      await interaction.update(await util.setupSave(interaction));
      break;
    case 'updateEmbed':
      await modal.updateEmbed(interaction);
      break;
    default:
      break;
  }
}

export async function tripsitRoleRemove(
  newMember: GuildMember,
  role: Role,
): Promise<void> {
  // Used in guildMemberUpdate.ts
  await util.removeExTeamFromThreads(newMember, role);
}

export const tripsitCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tripsit')
    .setDescription('Setup TripSitting Sessions')
    .addSubcommand(subcommand => subcommand
      .setDescription('Setup TripSit Sessions')
      .setName('setup'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Start a TripSit Session')
      .setName('start'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get info on how data is used, and delete it')
      .setName('privacy'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get statistics on tripsitting sessions')
      .setName('stats'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Get info on the TripSit Sessions module')
      .setName('help')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand() as | 'setup' | 'start' | 'privacy' | 'help' | 'stats';
    // eslint-disable-next-line sonarjs/no-small-switch
    switch (subcommand) {
      case 'setup':
        await interaction.editReply(await page.setupPageOne(interaction));
        break;
      case 'start':
        await interaction.editReply(await page.start(interaction));
        break;
      case 'privacy':
        await interaction.editReply(await page.privacy(interaction));
        break;
      case 'help':
        await interaction.editReply(await page.help(interaction));
        break;
      case 'stats':
        await interaction.editReply(await page.stats(interaction));
        break;
      default:
        break;
    }
    return true;
  },
};

export default tripsitCommand;
