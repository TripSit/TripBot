import { user_action_type, user_actions } from '@db/tripbot';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  Guild,
  GuildMember,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  time,
} from 'discord.js';
import { embedTemplate } from './embedTemplate';
import { tripSitTrustScore } from './trustScore';

const F = f(__filename);

export type ModHistoryInteraction = ButtonInteraction | StringSelectMenuInteraction;

// Only the types that get a count field on the mod embed.
const historyCategories = [
  {
    type: 'NOTE', plural: 'Notes', singular: 'Note', emoji: '🗒️', color: Colors.Yellow,
  },
  {
    type: 'WARNING', plural: 'Warns', singular: 'Warn', emoji: '⚠️', color: Colors.Yellow,
  },
  {
    type: 'REPORT', plural: 'Reports', singular: 'Report', emoji: '📝', color: Colors.Orange,
  },
  {
    type: 'TIMEOUT', plural: 'Timeouts', singular: 'Timeout', emoji: '⏳', color: Colors.Yellow,
  },
  {
    type: 'KICK', plural: 'Kicks', singular: 'Kick', emoji: '👢', color: Colors.Orange,
  },
  {
    type: 'FULL_BAN', plural: 'Bans', singular: 'Ban', emoji: '🔨', color: Colors.Red,
  },
  {
    type: 'UNDERBAN', plural: 'Underbans', singular: 'Underban', emoji: '🔨', color: Colors.Red,
  },
] as const;

type HistoryCategory = typeof historyCategories[number];

const profileValue = 'PROFILE';

export type ModActionCounts = Partial<Record<user_action_type, number>>;

export async function modActionCounts(userId: string): Promise<ModActionCounts> {
  const grouped = await db.user_actions.groupBy({
    by: ['type'],
    where: { user_id: userId },
    _count: { _all: true },
  });

  const counts = {} as ModActionCounts;
  grouped.forEach(row => {
    counts[row.type] = row._count._all; // eslint-disable-line no-underscore-dangle
  });
  return counts;
}

export function modHistoryRows(
  discordId: string,
  counts: ModActionCounts,
): ActionRowBuilder<StringSelectMenuBuilder>[] {
  const options = [
    new StringSelectMenuOptionBuilder()
      .setValue(profileValue)
      .setLabel('View Profile & TrustScore')
      .setDescription('Account age, join dates, roles, TrustScore')
      .setEmoji('ℹ️'),
    ...historyCategories
      .filter(category => (counts[category.type] ?? 0) > 0)
      .map(category => new StringSelectMenuOptionBuilder()
        .setValue(category.type)
        .setLabel(`View ${category.plural} (${counts[category.type]})`)
        .setEmoji(category.emoji)),
  ];

  return [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`modHistory~select~${discordId}`)
      .setPlaceholder('View Mod History')
      .addOptions(options),
  )];
}

function navigationRow(
  category: HistoryCategory,
  discordId: string,
  index: number,
  total: number,
): ActionRowBuilder<ButtonBuilder> {
  // Slot suffix stops First/Prev (and Next/Last) colliding on the edge pages.
  const button = (label: string, emoji: string, target: number, disabled: boolean) => new ButtonBuilder()
    .setCustomId(`modHistory~page~${category.type}~${discordId}~${target}~${label.toLowerCase()}`)
    .setLabel(label)
    .setEmoji(emoji)
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(disabled);

  const row = new ActionRowBuilder<ButtonBuilder>();
  if (total > 2) {
    row.addComponents(button('First', '⏮️', 0, index === 0));
  }
  row.addComponents(
    button('Prev', '◀️', Math.max(index - 1, 0), index === 0),
    button('Next', '▶️', Math.min(index + 1, total - 1), index === total - 1),
  );
  if (total > 2) {
    row.addComponents(button('Last', '⏭️', total - 1, index === total - 1));
  }

  return row;
}

async function historyPageEmbed(
  category: HistoryCategory,
  discordId: string,
  index: number,
  total: number,
  action: user_actions,
): Promise<EmbedBuilder> {
  const [creator, repealer] = await Promise.all([
    db.users.findUnique({ where: { id: action.created_by } }),
    action.repealed_by
      ? db.users.findUnique({ where: { id: action.repealed_by } })
      : Promise.resolve(null),
  ]);

  const embed = embedTemplate()
    .setColor(category.color)
    .setDescription(`**${category.singular} ${index + 1} of ${total}** for <@${discordId}>`)
    .addFields(
      {
        name: 'Moderator',
        value: creator?.discord_id ? `<@${creator.discord_id}>` : 'Unknown',
        inline: true,
      },
      {
        name: 'Date',
        value: `${time(action.created_at, 'f')}\n${time(action.created_at, 'R')}`,
        inline: true,
      },
      { name: 'Reason', value: action.internal_note.slice(0, 1024) || 'No reason provided' },
      {
        name: 'Note sent to user',
        value: action.description ? action.description.slice(0, 1024) : '*No message sent to user*',
      },
    )
    .setFooter({ text: `Page ${index + 1} / ${total}` });

  if (action.expires_at) {
    embed.addFields({ name: 'Expires', value: time(action.expires_at, 'R'), inline: true });
  }
  if (action.repealed_at) {
    const repealedBy = repealer?.discord_id ? `<@${repealer.discord_id}>` : 'Unknown';
    embed.addFields({
      name: 'Repealed',
      value: `${time(action.repealed_at, 'R')} by ${repealedBy}`,
      inline: true,
    });
  }

  return embed;
}

async function profileEmbed(guild: Guild, discordId: string): Promise<EmbedBuilder> {
  const [user, member, userData] = await Promise.all([
    discordClient.users.fetch(discordId).catch(() => null),
    guild.members.fetch(discordId).catch(() => null),
    db.users.findFirst({ where: { discord_id: discordId } }),
  ]);

  if (!user && !member) {
    return embedTemplate()
      .setColor(Colors.DarkOrange)
      .setDescription(`Could not fetch <@${discordId}>. The account was likely deleted.`);
  }

  const embed = embedTemplate()
    .setColor(Colors.Green)
    .setDescription(`**Profile for <@${discordId}>**`);

  const avatar = member?.displayAvatarURL() ?? user?.displayAvatarURL();
  if (avatar) {
    embed.setThumbnail(avatar);
  }

  embed.addFields(
    { name: 'Username', value: user?.username ?? 'Unknown', inline: true },
    { name: 'Display name', value: member?.displayName ?? user?.displayName ?? 'Unknown', inline: true },
    { name: 'ID', value: discordId, inline: true },
  );

  if (user) {
    embed.addFields({
      name: 'Account created',
      value: `${time(user.createdAt, 'D')}\n${time(user.createdAt, 'R')}`,
      inline: true,
    });
  }
  embed.addFields({
    name: 'Joined server',
    value: member?.joinedAt
      ? `${time(member.joinedAt, 'D')}\n${time(member.joinedAt, 'R')}`
      : 'Not in the server',
    inline: true,
  });
  if (userData) {
    embed.addFields({
      name: 'Known to TripBot since',
      value: `${time(userData.joined_at, 'D')}\n${time(userData.joined_at, 'R')}`,
      inline: true,
    });
    embed.addFields(
      { name: 'Last seen', value: time(userData.last_seen_at, 'R'), inline: true },
      {
        name: 'Karma',
        value: `${userData.karma_received} received / ${userData.karma_given} given`,
        inline: true,
      },
    );
  }

  const timeoutEnds = member?.communicationDisabledUntilTimestamp;
  if (timeoutEnds && timeoutEnds > Date.now()) {
    embed.addFields({
      name: 'Currently muted until',
      value: time(new Date(timeoutEnds), 'R'),
      inline: true,
    });
  }

  const roles = member?.roles.cache
    .filter(role => role.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .map(role => `<@&${role.id}>`) ?? [];
  if (roles.length > 0) {
    embed.addFields({ name: `Roles (${roles.length})`, value: roles.join(' ').slice(0, 1024) });
  }

  const { trustScore, tsReasoning } = await tripSitTrustScore(discordId);
  embed.addFields({
    name: 'TripSit TrustScore',
    value: `**${trustScore}**\n\`\`\`${tsReasoning.slice(0, 950)}\`\`\``,
  });

  return embed;
}

// Dropdown is modHistory~select~<id> with the type in values[0]; buttons are
// modHistory~page|open~<type>~<id>~<n>. 'open' only exists on already-posted embeds.
function parseHistoryId(interaction: ModHistoryInteraction): {
  isPage: boolean;
  type: string;
  discordId: string;
  rawIndex: string;
} {
  const parts = interaction.customId.split('~');
  if (interaction.isStringSelectMenu()) {
    return {
      isPage: false, type: interaction.values[0], discordId: parts[2], rawIndex: '0',
    };
  }
  return {
    isPage: parts[1] === 'page', type: parts[2], discordId: parts[3], rawIndex: parts[4],
  };
}

export async function modHistoryButton(interaction: ModHistoryInteraction): Promise<void> {
  if (!interaction.guild) {
    return;
  }
  const {
    isPage, type, discordId, rawIndex,
  } = parseHistoryId(interaction);

  const category = historyCategories.find(c => c.type === type);
  if (!category && type !== profileValue) {
    log.error(F, `Unknown mod history category: ${type}`);
    return;
  }

  if (isPage) {
    await interaction.deferUpdate();
  } else {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  }

  const guildData = await db.discord_guilds.upsert({
    where: { id: interaction.guild.id },
    create: { id: interaction.guild.id },
    update: {},
  });

  const actor = interaction.member as GuildMember | null;
  if (!guildData.role_moderator || !actor?.roles.cache.has(guildData.role_moderator)) {
    await interaction.editReply({
      embeds: [embedTemplate()
        .setColor(Colors.Red)
        .setDescription('Only moderators can view mod history.')],
      components: [],
    });
    return;
  }

  if (!category) {
    await interaction.editReply({
      embeds: [await profileEmbed(interaction.guild, discordId)],
      components: [],
    });
    return;
  }

  const userData = await db.users.findFirst({ where: { discord_id: discordId } });
  const actions = userData
    ? await db.user_actions.findMany({
      where: { user_id: userData.id, type: category.type },
      orderBy: { created_at: 'asc' },
    })
    : [];

  if (actions.length === 0) {
    await interaction.editReply({
      embeds: [embedTemplate()
        .setColor(Colors.DarkOrange)
        .setDescription(`No ${category.plural.toLowerCase()} found for <@${discordId}>.`)],
      components: [],
    });
    return;
  }

  const index = Math.min(Math.max(Number.parseInt(rawIndex, 10) || 0, 0), actions.length - 1);
  await interaction.editReply({
    embeds: [await historyPageEmbed(category, discordId, index, actions.length, actions[index])],
    components: actions.length > 1
      ? [navigationRow(category, discordId, index, actions.length)]
      : [],
  });
}

export default modHistoryButton;
