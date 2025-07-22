import type {
  ChatInputCommandInteraction,
  CommandInteraction,
  EmbedBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';

import {
  ActionRowBuilder,
  Colors,
  ComponentType,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { getBountyStats } from '../../../global/commands/g.bountyleaderboard';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

function createSelectMenu(currentType: string): StringSelectMenuBuilder {
  return new StringSelectMenuBuilder()
    .setCustomId('leaderboard_type')
    .setPlaceholder('Choose leaderboard type')
    .addOptions(
      {
        default: currentType === 'bounties',
        description: 'Sort by number of bounties claimed',
        emoji: '🏆',
        label: 'Most Bounties Claimed',
        value: 'bounties',
      },
      {
        default: currentType === 'xp',
        description: 'Sort by total XP earned from bounties',
        emoji: '⭐',
        label: 'Most XP Earned',
        value: 'xp',
      },
    );
}

async function generateLeaderboardEmbed(
  type: string,
  interaction: CommandInteraction,
): Promise<EmbedBuilder> {
  const stats = await getBountyStats();

  // Sort based on type
  const sortedStats =
    type === 'xp'
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
      inline: false,
      name: '📭 No Data Available',
      value: 'No bounties have been claimed yet!',
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

      return (
        `${medal} **${user.username}**\n` +
        `├ ${primaryStat.toLocaleString()} ${primaryLabel}\n` +
        `└ ${secondaryStat.toLocaleString()} ${secondaryLabel}`
      );
    })
    .join('\n\n');

  embed.addFields({
    inline: false,
    name: '\u200B', // Invisible character for spacing
    value: leaderboardText,
  });

  // Add statistics summary
  const totalBounties = stats.reduce((sum, user) => sum + user.totalBounties, 0);
  const totalXP = stats.reduce((sum, user) => sum + user.totalXP, 0);
  const totalUsers = stats.length;

  embed.addFields({
    inline: false,
    name: '📊 Server Statistics',
    value:
      `**${totalUsers}** active bounty hunters\n` +
      `**${totalBounties.toLocaleString()}** total bounties claimed\n` +
      `**${totalXP.toLocaleString()}** total XP earned`,
  });

  return embed;
}

function getMedal(position: number): string {
  switch (position) {
    case 1: {
      return '🥇';
    }
    case 2: {
      return '🥈';
    }
    case 3: {
      return '🥉';
    }
    default: {
      return `**${position}.**`;
    }
  }
}

export const dLeaderboard: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('bounty_leaderboard')
    .setDescription('Display bounty leaderboards for TripBot')
    .setIntegrationTypes([0])
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Type of leaderboard to display')
        .setRequired(false)
        .addChoices(
          { name: '🏆 Most Bounties Claimed', value: 'bounties' },
          { name: '⭐ Most XP Earned', value: 'xp' },
        ),
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction): Promise<boolean> {
    try {
      await interaction.deferReply();

      const leaderboardType = (interaction.options.get('type')?.value as string) || 'bounties';

      const embed = await generateLeaderboardEmbed(leaderboardType, interaction);
      const selectMenu = createSelectMenu(leaderboardType);
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      const response = await interaction.editReply({
        components: [row],
        embeds: [embed],
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
          components: [newRow],
          embeds: [newEmbed],
        });
      });

      collector.on('end', async () => {
        try {
          await interaction.editReply({ components: [] });
        } catch {
          // Ignore errors when removing components (message might be deleted)
        }
      });

      return true;
    } catch (error) {
      log.error(F, `Error in leaderboard command:, ${error}`);
      const errorMessage = 'An error occurred while generating the leaderboard.';

      await (interaction.deferred
        ? interaction.editReply({ content: errorMessage })
        : interaction.reply({ content: errorMessage, ephemeral: true }));
      return false;
    }
  },
};

export default dLeaderboard;
