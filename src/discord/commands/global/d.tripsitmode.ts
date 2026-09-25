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
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
// import {embedTemplate} from '../../utils/embedTemplate';
// import {stripIndents} from 'common-tags';
// import env from '../../../global/utils/env.config';
// import log from '../../../global/utils/log';
import {
  needsHelpMode, reopenTicket, tripSitMe, tripsitmeUserClose,
} from '../../utils/tripsitme';
import {
  ensurePermissions, TRIPSIT_CHANNEL_PERMS, tripsitChannelOwnerMessage,
} from '../../utils/checkPermissions';
import { getOrCreateGuild, getOrCreateUser } from '../../../global/utils/dbRecords';
// import { modmailDMInteraction } from '../archive/modmail';

const F = f(__filename);

async function tripsitmodeOn(
  interaction:ChatInputCommandInteraction,
  target:GuildMember,
) {
  if (!interaction.guild) return false;
  if (!interaction.member) return false;

  let guildData = await getOrCreateGuild(interaction.guild?.id);

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

  if (!await ensurePermissions(tripsitChannel, TRIPSIT_CHANNEL_PERMS, F, {
    ownerMessage: () => tripsitChannelOwnerMessage(tripsitChannel, false),
  })) return false;

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

  if (!await ensurePermissions(channelTripsitmeta, TRIPSIT_CHANNEL_PERMS, F, {
    ownerMessage: () => tripsitChannelOwnerMessage(channelTripsitmeta, true),
  })) return false;
  // const showMentions = actorIsAdmin ? [] : ['users', 'roles'] as MessageMentionTypes[];

  log.debug(F, `Target: ${target.displayName} (${target.id})`);
  const userData = await getOrCreateUser(target.id);
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

      let roleNeedshelp = {} as Role;
      if (guildData.role_needshelp) {
        roleNeedshelp = await interaction.guild?.roles.fetch(guildData.role_needshelp) as Role;
      }
      log.debug(F, `Needshelp Role : ${roleNeedshelp.name}`);

      await reopenTicket({
        interaction,
        target,
        guildData,
        ticketData,
        threadHelpUser,
        helpMessage: stripIndents`Hey ${target}, the team thinks you could still use some help, lets continue talking here!`, // eslint-disable-line max-len
        metaSubject: `${interaction.member} has indicated that ${target.displayName} needs assistance!`,
      });

      // remind the user they have an open thread
      const embed = embedTemplate()
        .setColor(Colors.DarkBlue)
        .setDescription(stripIndents`Hey ${interaction.member}, ${target.displayName} already has an open ticket!
            I've re-applied the ${roleNeedshelp} role to them, and updated the thread.
            Check your channel list or click '${threadHelpUser.toString()} to see!`);
      await interaction.editReply({ embeds: [embed] });
      return true;
    }
  }

  // If no existing threads are available, create a new one
  await interaction.showModal(new ModalBuilder()
    .setCustomId(`tripsitmeSubmit~${interaction.id}`)
    .setTitle('TripSit Mode Activated!')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>()
        .addComponents(
          new TextInputBuilder()
            .setCustomId('triageInput')
            .setLabel('What substance did they take, etc?')
            .setPlaceholder('This will be posted in the channel for them to see!')
            .setStyle(TextInputStyle.Short),
        ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
        .setCustomId('introInput')
        .setLabel('What\'s going on with them?')
        .setPlaceholder('This will be posted in the channel for them to see!')
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

      const replyMessage = stripIndents`
      Hey ${i.member}, you activated tripsit mode on ${target.displayName}!
  
      Click here to be taken to their private room: ${threadHelpUser}
  
      You can also click in your channel list to see your private room!`;
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
    .setDescription(
      'This command will apply the NeedsHelp role onto a user, and remove other roles!',
    )
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
    const enable = interaction.options.getSubcommand() as 'on' | 'off';

    const target = interaction.options.getMember('user') as GuildMember;

    if (enable === 'on') {
      tripsitmodeOn(interaction, target);
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
