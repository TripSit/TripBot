import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  // ButtonBuilder,
  ModalSubmitInteraction,
  // TextChannel,
  Colors,
  Guild,
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
  LabelBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import {
  needsHelpMode, reopenTicket, tripSitMe, tripsitmeUserClose,
} from '../../utils/tripsitme';
import {
  ensurePermissions, TRIPSIT_CHANNEL_PERMS, tripsitChannelOwnerMessage,
} from '../../utils/checkPermissions';
import { getOrCreateGuild, getOrCreateUser } from '../../../global/utils/dbRecords';
import { awaitModal } from '../../utils/awaitModal';

const F = f(__filename);

type GuildRow = Awaited<ReturnType<typeof getOrCreateGuild>>;
type TicketRow = NonNullable<Awaited<ReturnType<typeof db.user_tickets.findFirst>>>;

/**
 * Fetches a channel configured on the guild. When it can't be fetched (it was likely deleted)
 * the setting is cleared, and an empty channel is returned.
 */
async function fetchGuildChannel(
  guild: Guild,
  guildData: GuildRow,
  field: 'channel_tripsit' | 'channel_tripsitmeta',
): Promise<{ channel: TextChannel; guildData: GuildRow }> {
  let channel = {} as TextChannel;
  try {
    if (guildData[field]) {
      channel = await guild.channels.fetch(guildData[field]) as TextChannel;
    }
  } catch {
    // The channel was likely deleted, so forget about it
    const updated = await db.discord_guilds.update({
      where: {
        id: guild.id,
      },
      data: {
        [field]: null,
      },
    });
    return { channel, guildData: updated };
  }
  return { channel, guildData };
}

/** Re-opens a user's existing ticket thread. Returns false when the thread no longer exists. */
async function reopenExistingTicket(
  interaction: ChatInputCommandInteraction,
  target: GuildMember,
  guildData: GuildRow,
  existingTicket: TicketRow,
): Promise<boolean> {
  let ticketData = existingTicket;
  log.debug(F, `Target has tickets: ${JSON.stringify(ticketData, null, 2)}`);

  let threadHelpUser = {} as ThreadChannel;
  try {
    threadHelpUser = await interaction.guild?.channels.fetch(ticketData.thread_id) as ThreadChannel;
  } catch {
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

  if (!threadHelpUser.id) return false;

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
    metaSubject: `${interaction.member as GuildMember} has indicated that ${target.displayName} needs assistance!`,
    status: 'OWNED',
  });

  // remind the user they have an open thread
  const embed = embedTemplate()
    .setColor(Colors.DarkBlue)
    .setDescription(stripIndents`Hey ${interaction.member as GuildMember}, ${target.displayName} already has an open ticket!
            I've re-applied the ${roleNeedshelp} role to them, and updated the thread.
            Check your channel list or click '${threadHelpUser.toString()} to see!`);
  await interaction.editReply({ embeds: [embed] });
  return true;
}

async function tripsitmodeOn(
  interaction:ChatInputCommandInteraction,
  target:GuildMember,
) {
  if (!interaction.guild) return false;
  if (!interaction.member) return false;

  let guildData = await getOrCreateGuild(interaction.guild?.id);

  // Get the tripsit channel from the guild
  const tripsitFetch = await fetchGuildChannel(interaction.guild, guildData, 'channel_tripsit');
  const tripsitChannel = tripsitFetch.channel;
  guildData = tripsitFetch.guildData;

  // Fix tripsitmode causing errors if no channel has been set
  if (!tripsitChannel || !(tripsitChannel instanceof TextChannel)) return false;

  if (!await ensurePermissions(tripsitChannel, TRIPSIT_CHANNEL_PERMS, F, {
    ownerMessage: () => tripsitChannelOwnerMessage(tripsitChannel, false),
  })) return false;

  // Get the tripsit meta channel from the guild
  const metaFetch = await fetchGuildChannel(interaction.guild, guildData, 'channel_tripsitmeta');
  const channelTripsitmeta = metaFetch.channel;
  guildData = metaFetch.guildData;

  if (!await ensurePermissions(channelTripsitmeta, TRIPSIT_CHANNEL_PERMS, F, {
    ownerMessage: () => tripsitChannelOwnerMessage(channelTripsitmeta, true),
  })) return false;

  log.debug(F, `Target: ${target.displayName} (${target.id})`);
  const userData = await getOrCreateUser(target.id);
  log.debug(F, `Target userData: ${JSON.stringify(userData, null, 2)}`);
  const ticketData = await db.user_tickets.findFirst({
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
  if (ticketData && await reopenExistingTicket(interaction, target, guildData, ticketData)) {
    return true;
  }

  // If no existing threads are available, create a new one
  await interaction.showModal(new ModalBuilder()
    .setCustomId(`tripsitmeSubmit~${interaction.id}`)
    .setTitle('TripSit Mode Activated!')
    .addLabelComponents(
      new LabelBuilder().setLabel('What substance did they take, etc?').setTextInputComponent(new TextInputBuilder()
        .setCustomId('triageInput')

        .setPlaceholder('This will be posted in the channel for them to see!')
        .setStyle(TextInputStyle.Short)),
      new LabelBuilder().setLabel('What\'s going on with them?').setTextInputComponent(new TextInputBuilder()
        .setCustomId('introInput')

        .setPlaceholder('This will be posted in the channel for them to see!')
        .setStyle(TextInputStyle.Paragraph)),
    ));

  const filter = (i:ModalSubmitInteraction) => i.customId.startsWith('tripsitmeSubmit') && i.customId.split('~')[1] === interaction.id;
  await awaitModal(interaction, filter)
    .then(async i => {
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
