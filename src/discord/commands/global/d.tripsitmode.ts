import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  // ButtonBuilder,
  ModalSubmitInteraction,
  // TextChannel,
  Colors,
  GuildMember,
  Role,
  ThreadChannel,
  ButtonInteraction,
  // Message,
  // MessageReaction,
  // User,
  // ChatInputCommandInteraction,
  // PermissionsBitField,
  // TextChannel,
  // MessageFlags,
  // MessageMentionTypes,
  TextInputStyle,
  TextChannel,
  PermissionResolvable,
  MessageMentionTypes,
  InteractionDeferReplyOptions,
  APIModalInteractionResponseCallbackData,
  JSONEncodable,
  ModalComponentData,
  AwaitModalSubmitOptions,
  CacheType,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  MessagePayload,
  MessageFlags,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { DateTime } from 'luxon';
import { ticket_status } from '@db/tripbot';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
// import {embedTemplate} from '../../utils/embedTemplate';
// import {stripIndents} from 'common-tags';
// import env from '../../../global/utils/env.config';
// import log from '../../../global/utils/log';
import { needsHelpMode, tripSitMe, tripsitmeUserClose } from '../../utils/tripsitme';
import { checkChannelPermissions } from '../../utils/checkPermissions';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';
// import { modmailDMInteraction } from '../archive/modmail';

const F = f(__filename);

async function tripsitmodeOn(
  interaction:ChatInputCommandInteraction,
  target:GuildMember,
  locale:string,
) {
  if (!interaction.guild) return false;
  if (!interaction.member) return false;

  let guildData = await db.discord_guilds.upsert({
    where: {
      id: interaction.guild?.id,
    },
    create: {
      id: interaction.guild?.id,
    },
    update: {},
  });

  // Get the tripsit channel from the guild
  let tripsitChannel = {} as TextChannel;
  try {
    if (guildData.channel_tripsit) {
      tripsitChannel = await interaction.guild?.channels.fetch(guildData.channel_tripsit) as TextChannel;
    }
  } catch (err) {
    // log.debug(F, `There was an error fetching the tripsit channel, it was likely deleted:\n ${err}`);
    // Update the ticket status to closed
    guildData = await db.discord_guilds.update({
      where: {
        id: interaction.guild.id,
      },
      data: {
        channel_tripsit: null,
      },
    });
  }

  // Fix tripsitmode causing errors if no channel has been set
  if (!tripsitChannel || !(tripsitChannel instanceof TextChannel)) return false;

  const channelPerms = await checkChannelPermissions(tripsitChannel, [
    'ViewChannel' as PermissionResolvable,
    'SendMessages' as PermissionResolvable,
    'SendMessagesInThreads' as PermissionResolvable,
    // 'CreatePublicThreads' as PermissionResolvable,
    'CreatePrivateThreads' as PermissionResolvable,
    // 'ManageMessages' as PermissionResolvable,
    'ManageThreads' as PermissionResolvable,
    // 'EmbedLinks' as PermissionResolvable,
  ]);
  if (!channelPerms.hasPermission) {
    log.error(F, `Missing TS channel permission ${channelPerms.permission} in ${tripsitChannel.name}!`);
    const guildOwner = await interaction.guild?.fetchOwner() as GuildMember;
    await guildOwner.send({
      content: stripIndents`Missing permissions in ${tripsitChannel}!
      In order to setup the tripsitting feature I need:
      View Channel - to see the channel
      Send Messages - to send messages
      Create Private Threads - to create private threads
      Send Messages in Threads - to send messages in threads
      Manage Threads - to delete threads when they're done
      `}); // eslint-disable-line
    log.error(F, `Missing TS channel permission ${channelPerms.permission} in ${tripsitChannel.name}!`);
    return false;
  }

  // Get the tripsit meta channel from the guild
  let channelTripsitmeta = {} as TextChannel;
  try {
    // log.debug(F, `guildData.channel_tripsitmeta: ${guildData.channel_tripsitmeta}`);
    if (guildData.channel_tripsitmeta) {
      channelTripsitmeta = await interaction.guild?.channels.fetch(guildData.channel_tripsitmeta) as TextChannel;
    }
  } catch (err) {
    // log.debug(F, `There was an error fetching the tripsit channel, it was likely deleted:\n ${err}`);
    // Update the ticket status to closed
    guildData = await db.discord_guilds.update({
      where: {
        id: interaction.guild.id,
      },
      data: {
        channel_tripsitmeta: null,
      },
    });
  }

  const metaPerms = await checkChannelPermissions(channelTripsitmeta, [
    'ViewChannel' as PermissionResolvable,
    'SendMessages' as PermissionResolvable,
    'SendMessagesInThreads' as PermissionResolvable,
    // 'CreatePublicThreads' as PermissionResolvable,
    'CreatePrivateThreads' as PermissionResolvable,
    // 'ManageMessages' as PermissionResolvable,
    'ManageThreads' as PermissionResolvable,
    // 'EmbedLinks' as PermissionResolvable,
  ]);
  if (!metaPerms.hasPermission) {
    log.error(F, `Missing TS channel permission ${channelPerms.permission} in ${channelTripsitmeta.name}!`);
    const guildOwner = await interaction.guild?.fetchOwner() as GuildMember;
    await guildOwner.send({
      content: stripIndents`Missing permissions in ${channelTripsitmeta}!
    In order to setup the tripsitting feature I need:
    View Channel - to see the channel
    Send Messages - to send messages
    Create Private Threads - to create private threads, when requested through the bot
    Send Messages in Threads - to send messages in threads
    Manage Threads - to delete threads when they're done
    `}); // eslint-disable-line
    log.error(F, `Missing permission ${metaPerms.permission} in ${tripsitChannel.name}!`);
    return false;
  }
  // const showMentions = actorIsAdmin ? [] : ['users', 'roles'] as MessageMentionTypes[];

  log.debug(F, `Target: ${target.displayName} (${target.id})`);
  const userData = await db.users.upsert({
    where: {
      discord_id: target.id,
    },
    create: {
      discord_id: target.id,
    },
    update: {},
  });
  log.debug(F, `Target userData: ${JSON.stringify(userData, null, 2)}`);
  let ticketData = await db.user_tickets.findFirst({
    where: {
      user_id: userData.id,
      type: 'TRIPSIT',
    },
    orderBy: {
      thread_id: 'desc',
    },
  });
  log.debug(F, `Target ticket data: ${JSON.stringify(ticketData, null, 2)}`);

  // If a thread exists, re-apply needsHelp, update the thread, remind the user
  if (ticketData) {
    log.debug(F, `Target has tickets: ${JSON.stringify(ticketData, null, 2)}`);

    let threadHelpUser = {} as ThreadChannel;
    try {
      threadHelpUser = await interaction.guild?.channels.fetch(ticketData.thread_id) as ThreadChannel;
    } catch (err) {
      log.debug(F, 'There was an error updating the help thread, it was likely deleted');
      ticketData = await db.user_tickets.update({
        where: {
          id: ticketData.id,
        },
        data: {
          status: 'DELETED',
          archived_at: new Date(),
          deleted_at: new Date(),
        },
      });

      log.debug(F, 'Updated ticket status to DELETED');
      log.debug(F, `Ticket: ${JSON.stringify(ticketData, null, 2)}`);
    }

    log.debug(F, `ThreadHelpUser: ${threadHelpUser.name}`);

    if (threadHelpUser.id) {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await needsHelpMode(interaction, target);
      log.debug(F, 'Added needshelp to user');
      let roleTripsitter = {} as Role;
      let roleHelper = {} as Role;
      let roleNeedshelp = {} as Role;
      if (guildData.role_tripsitter) {
        roleTripsitter = await interaction.guild?.roles.fetch(guildData.role_tripsitter) as Role;
      }
      if (guildData.role_helper) {
        roleHelper = await interaction.guild?.roles.fetch(guildData.role_helper) as Role;
      }
      if (guildData.role_needshelp) {
        roleNeedshelp = await interaction.guild?.roles.fetch(guildData.role_needshelp) as Role;
      }
      log.debug(F, `Helper Role : ${roleHelper.name}`);
      log.debug(F, `Tripsitter Role : ${roleTripsitter.name}`);
      log.debug(F, `Needshelp Role : ${roleNeedshelp.name}`);

      // Remind the user that they have a channel open
      // const recipient = '' as string;

      let helpMessage = stripIndents`${t(locale, 'tripsitmode.helpMessage', { target: target.toString() })}`; // eslint-disable-line max-len

      // If the help ticket was created < 5 mins ago, don't re-ping the team
      const createdDate = new Date(ticketData.reopened_at ?? ticketData.created_at);
      const now = new Date();
      const diff = now.getTime() - createdDate.getTime();
      const minutes = Math.floor(diff / 1000 / 60);
      // const seconds = Math.floor(diff / 1000); // Uncomment this for dev server
      if (minutes > 5) {
        // log.debug(F, `Target has open ticket, and it was created over 5 minutes ago!`);
        if (guildData.role_helper) {
          const helperStr = `and/or ${roleHelper.toString()}`;
          helpMessage += `\n\n${t(locale, 'tripsitmode.helpMessageWithTeam', { roleTripsitter: roleTripsitter.toString(), helperStr })}`; // eslint-disable-line max-len
        } else {
          helpMessage += `\n\n${t(locale, 'tripsitmode.helpMessageNoHelper', { roleTripsitter: roleTripsitter.toString() })}`; // eslint-disable-line max-len
        }
      }
      await threadHelpUser.send({
        content: helpMessage,
        allowedMentions: {
          // parse: showMentions,
          parse: ['users', 'roles'] as MessageMentionTypes[],
        },
      });

      log.debug(F, 'Pinged user in help thread');
      threadHelpUser.setName(t(locale, 'tripsitmode.threadName', { target: target.displayName }));
      log.debug(F, 'Updated thread name');

      // If the meta thread exists, update the name and ping the team
      if (ticketData.meta_thread_id) {
        let metaMessage = '';
        if (minutes > 5) { // Switch to seconds > 10 for dev server
          try {
            if (guildData.role_helper) {
              metaMessage = t(locale, 'tripsitmode.metaMessageWithHelper', {
                roleTripsitter: roleTripsitter.toString(),
                helperString: `and/or ${roleHelper.toString()}`,
                member: interaction.member?.toString(),
                target: target.displayName,
              });
            } else {
              metaMessage = t(locale, 'tripsitmode.metaMessageNoHelper', {
                roleTripsitter: roleTripsitter.toString(),
                member: interaction.member?.toString(),
                target: target.displayName,
              });
            }
          } catch (err) {
            // If for example helper role has been deleted but the ID is still stored, do this
            metaMessage = t(locale, 'tripsitmode.metaMessageNoHelper', {
              roleTripsitter: roleTripsitter.toString(),
              member: interaction.member?.toString(),
              target: target.displayName,
            });
            log.error(F, `Stored Helper ID for guild ${guildData.id} is no longer valid. Role is unfetchable or deleted.`);
          }
        } else {
          metaMessage = t(locale, 'tripsitmode.metaMessageSimple', {
            member: interaction.member?.toString(),
            target: target.displayName,
          });
        }
        // Get the tripsit meta channel from the guild
        let metaThread = {} as ThreadChannel;
        try {
          metaThread = await interaction.guild?.channels.fetch(ticketData.meta_thread_id) as ThreadChannel;
          metaThread.setName(t(locale, 'tripsitmode.metaThreadName', { target: target.displayName }));
          await metaThread.send({
            content: metaMessage,
            allowedMentions: {
              // parse: showMentions,
              parse: ['users', 'roles'] as MessageMentionTypes[],
            },
          });
          log.debug(F, 'Pinged team in meta thread!');
        } catch (err) {
          // log.debug(F, `There was an error fetching the tripsit channel, it was likely deleted:\n ${err}`);
          // Update the ticket status to closed
          ticketData = await db.user_tickets.update({
            where: {
              id: ticketData.id,
            },
            data: {
              meta_thread_id: null,
            },
          });
        }
      }

      ticketData = await db.user_tickets.update({
        where: {
          id: ticketData.id,
        },
        data: {
          status: 'OPEN' as ticket_status,
          reopened_at: new Date(),
          archived_at: env.NODE_ENV === 'production'
            ? DateTime.local().plus({ days: 3 }).toJSDate()
            : DateTime.local().plus({ minutes: 1 }).toJSDate(),
          deleted_at: env.NODE_ENV === 'production'
            ? DateTime.local().plus({ days: 5 }).toJSDate()
            : DateTime.local().plus({ minutes: 2 }).toJSDate(),
        },
      });

      // remind the user they have an open thread
      const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription(t(locale, 'tripsitmode.existingTicketDescription', {
          member: interaction.member?.toString(),
          target: target.displayName,
          roleNeedshelp: roleNeedshelp.toString(),
          threadHelpUser: threadHelpUser.toString(),
        }));
      await interaction.editReply({ embeds: [embed] });
      return true;
    }
  }

  // If no existing threads are available, create a new one
  await interaction.showModal(new ModalBuilder()
    .setCustomId(`tripsitmeSubmit~${interaction.id}`)
    .setTitle(t(locale, 'tripsitmode.modalTitle'))
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setCustomId('triageInput')
            .setLabel(t(locale, 'tripsitmode.triageLabel'))
            .setPlaceholder(t(locale, 'tripsitmode.triagePlaceholder'))
            .setStyle(TextInputStyle.Short),
        ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId('introInput')
        .setLabel(t(locale, 'tripsitmode.introLabel'))
        .setPlaceholder(t(locale, 'tripsitmode.introPlaceholder'))
        .setStyle(TextInputStyle.Paragraph)),
    ));

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('tripsitmeSubmit');
  await interaction.awaitModalSubmit({ filter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      await i.deferReply({ flags: MessageFlags.Ephemeral });
      const triage = i.fields.getTextInputValue('triageInput');
      const intro = i.fields.getTextInputValue('introInput');

      const threadHelpUser = await tripSitMe(i, target, triage, intro) as ThreadChannel;

      const replyMessage = t(locale, 'tripsitmode.newTicketMessage', {
        member: i.member?.toString(),
        target: target.displayName,
        threadHelpUser: threadHelpUser.toString(),
      });
      const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription(replyMessage);
      await i.editReply({ embeds: [embed] });
    });

  return true;
}

export const tripsitmode: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tripsitmode')
    .setNameLocalizations(getCommandLocalizations('tripsitmode.commandName'))
    .setDescription(
      'This command will apply the NeedsHelp role onto a user, and remove other roles!',
    )
    .setDescriptionLocalizations(getCommandLocalizations('tripsitmode.commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('on')
      .setDescription('Turn on tripsit mode for a user')
      .addUserOption(option => option
        .setName('user')
        .setDescription('Member to modify')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('off')
      .setDescription('Turn off tripsit mode for a user')
      .addUserOption(option => option
        .setName('user')
        .setDescription('Member to modify')
        .setRequired(true))),
  async execute(interaction:ChatInputCommandInteraction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'tripsitmode');
    const enable = interaction.options.getSubcommand() as 'on' | 'off';

    const target = interaction.options.getMember('user') as GuildMember;

    if (enable === 'on') {
      tripsitmodeOn(interaction, target, locale);
    }

    if (enable === 'off') {
      const testInteraction = {
        client: interaction.client,
        id: interaction.id,
        customId: `tripsitmodeOffOverride~${target.id}`,
        guild: interaction.guild,
        member: interaction.member,
        user: interaction.user,
        channel: interaction.channel,
        deferReply: (content: InteractionDeferReplyOptions & { withResponse: true; }) => interaction.deferReply(content),
        reply: (content: string | MessagePayload | InteractionReplyOptions) => {
          if (interaction.deferred || interaction.replied) {
            return interaction.followUp(content);
          }
          return interaction.reply(content);
        },
        editReply: (content: string | MessagePayload | InteractionEditReplyOptions) => interaction.editReply(content),
        followUp: (content: string | MessagePayload | InteractionReplyOptions) => interaction.followUp(content),
        showModal: (modal: APIModalInteractionResponseCallbackData | ModalComponentData | JSONEncodable<APIModalInteractionResponseCallbackData>) => interaction.showModal(modal),
        awaitModalSubmit: (params: AwaitModalSubmitOptions<ModalSubmitInteraction<CacheType>>) => interaction.awaitModalSubmit(params),
      } as unknown as ButtonInteraction;
      tripsitmeUserClose(testInteraction);
    }
    return true;
  },
};

export default tripsitmode;
