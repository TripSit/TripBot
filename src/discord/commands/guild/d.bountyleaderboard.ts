import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  StringSelectMenuInteraction,
  Colors,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

interface BountyStats {
  userId: string;
  username: string;
  totalBounties: number;
  totalXP: number;
}

function getMedal(position: number): string {
  switch (position) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return `**${position}.**`;
  }
}

async function getBountyStats(): Promise<BountyStats[]> {
  try {
    const rawData = await db.claimed_bounties.findMany({
      select: {
        user_id: true,
        amount: true,
      },
    });

    if (rawData.length === 0) {
      return [];
    }

    // Try the groupBy approach first
    const bountyData = await db.claimed_bounties.groupBy({
      by: ['user_id'],
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    if (bountyData.length === 0) {
      // Manual aggregation fallback
      const userStats = new Map<string, { count: number; totalXP: number }>();

      rawData.forEach(record => {
        const existing = userStats.get(record.user_id) || { count: 0, totalXP: 0 };
        userStats.set(record.user_id, {
          count: existing.count + 1,
          totalXP: existing.totalXP + (record.amount || 0),
        });
      });

      const stats: BountyStats[] = Array.from(userStats.entries()).map(([userId, data]) => ({
        userId,
        username: `<@${userId}>`,
        totalBounties: data.count,
        totalXP: data.totalXP,
      }));

      return stats;
    }

    const stats: BountyStats[] = bountyData.map(data => ({
      userId: data.user_id,
      username: `<@${data.user_id}>`,
      // eslint-disable-next-line no-underscore-dangle
      totalBounties: data._count.id,
      // eslint-disable-next-line no-underscore-dangle
      totalXP: data._sum.amount || 0,
    }));

    return stats.filter(stat => stat.totalBounties > 0);
  } catch (error) {
    return [];
  }
}

async function generateLeaderboardEmbed(
  type: string,
  interaction: CommandInteraction,
): Promise<EmbedBuilder> {
  const stats = await getBountyStats();

  // Sort based on type
  const sortedStats = type === 'xp'
    ? stats.sort((a, b) => b.totalXP - a.totalXP)
    : stats.sort((a, b) => b.totalBounties - a.totalBounties);

  const topUsers = sortedStats.slice(0, 10); // Top 10 users

  const embed = embedTemplate()
    .setColor(type === 'xp' ? Colors.Gold : Colors.Green) // Gold for XP, Green for bounties
    .setThumbnail(interaction.guild?.iconURL() || null)
    .setTimestamp();

  if (type === 'xp') {
    embed.setDescription('⭐ **Top Bounty Hunters by XP Earned**\n');
  } else {
    embed.setDescription('🏆 **Top Bounty Hunters by Bounties Claimed**\n');
  }

  if (topUsers.length === 0) {
    embed.addFields({
      name: '📭 No Data Available',
      value: 'No bounties have been claimed yet!',
      inline: false,
    });
    return embed;
  }

  // Create leaderboard entries
  const leaderboardText = topUsers
    .map((user, index) => {
      const position = index + 1;
      const medal = getMedal(position);
      const primaryStat = type === 'xp' ? user.totalXP : user.totalBounties;
      const secondaryStat = type === 'xp' ? user.totalBounties : user.totalXP;
      const primaryLabel = type === 'xp' ? 'XP' : 'bounties';
      const secondaryLabel = type === 'xp' ? 'bounties' : 'XP';

      return `${medal} **${user.username}**\n`
             + `├ ${primaryStat.toLocaleString()} ${primaryLabel}\n`
             + `└ ${secondaryStat.toLocaleString()} ${secondaryLabel}`;
    })
    .join('\n\n');

  embed.addFields({
    name: '\u200B', // Invisible character for spacing
    value: leaderboardText,
    inline: false,
  });

  // Add statistics summary
  const totalBounties = stats.reduce((sum, user) => sum + user.totalBounties, 0);
  const totalXP = stats.reduce((sum, user) => sum + user.totalXP, 0);
  const totalUsers = stats.length;

  embed.addFields({
    name: '📊 Server Statistics',
    value: `**${totalUsers}** active bounty hunters\n`
           + `**${totalBounties.toLocaleString()}** total bounties claimed\n`
           + `**${totalXP.toLocaleString()}** total XP earned`,
    inline: false,
  });

  return embed;
}

function createSelectMenu(currentType: string): StringSelectMenuBuilder {
  return new StringSelectMenuBuilder()
    .setCustomId('leaderboard_type')
    .setPlaceholder('Choose leaderboard type')
    .addOptions(
      {
        label: 'Most Bounties Claimed',
        description: 'Sort by number of bounties claimed',
        value: 'bounties',
        emoji: '🏆',
        default: currentType === 'bounties',
      },
      {
        label: 'Most XP Earned',
        description: 'Sort by total XP earned from bounties',
        value: 'xp',
        emoji: '⭐',
        default: currentType === 'xp',
      },
    );
}

export const dLeaderboard: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('bounty_leaderboard')
    .setDescription('Display bounty leaderboards for TripBot')
    .setIntegrationTypes([0])
    .addStringOption(option => option
      .setName('type')
      .setDescription('Type of leaderboard to display')
      .setRequired(false)
      .addChoices(
        { name: '🏆 Most Bounties Claimed', value: 'bounties' },
        { name: '⭐ Most XP Earned', value: 'xp' },
      )) as SlashCommandBuilder,

  async execute(interaction: CommandInteraction): Promise<boolean> {
    try {
      await interaction.deferReply();

      const leaderboardType = interaction.options.get('type')?.value as string || 'bounties';

      const embed = await generateLeaderboardEmbed(leaderboardType, interaction);
      const selectMenu = createSelectMenu(leaderboardType);
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      const response = await interaction.editReply({
        embeds: [embed],
        components: [row],
      });

      // Handle select menu interactions
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 300_000, // 5 minutes
      });

      collector.on('collect', async (selectInteraction: StringSelectMenuInteraction) => {
        if (selectInteraction.user.id !== interaction.user.id) {
          await selectInteraction.reply({
            content: 'Only the command user can change the leaderboard type.',
            ephemeral: true,
          });
          return;
        }

        const newType = selectInteraction.values[0];
        const newEmbed = await generateLeaderboardEmbed(newType, interaction);
        const newSelectMenu = createSelectMenu(newType);
        const newRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(newSelectMenu);

        await selectInteraction.update({
          embeds: [newEmbed],
          components: [newRow],
        });
      });

      collector.on('end', async () => {
        try {
          await interaction.editReply({ components: [] });
        } catch (error) {
          // Ignore errors when removing components (message might be deleted)
        }
      });

      return true;
    } catch (error) {
      log.error(F, `Error in leaderboard command:, ${error}`);
      const errorMessage = 'An error occurred while generating the leaderboard.';

      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
      return false;
    }
  },
};

export default dLeaderboard;
