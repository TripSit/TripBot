import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  StringSelectMenuInteraction,
  Colors,
  ChatInputCommandInteraction,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { getBountyStats } from '../../../global/commands/g.bountyleaderboard';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

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

async function generateLeaderboardEmbed(
  type: string,
  interaction: CommandInteraction,
  locale: string,
): Promise<EmbedBuilder> {
  const stats = await getBountyStats();

  const sortedStats = type === 'xp'
    ? stats.sort((a, b) => b.totalXP - a.totalXP)
    : stats.sort((a, b) => b.totalBounties - a.totalBounties);

  const topUsers = sortedStats.slice(0, 10);

  const embed = embedTemplate()
    .setColor(type === 'xp' ? Colors.Gold : Colors.Green)
    .setThumbnail(interaction.guild?.iconURL() || null)
    .setTimestamp();

  embed.setDescription(t(locale, 'bountyleaderboard', type === 'xp' ? 'xpEmbedDesc' : 'bountiesEmbedDesc'));

  if (topUsers.length === 0) {
    embed.addFields({
      name: t(locale, 'bountyleaderboard', 'noDataField'),
      value: t(locale, 'bountyleaderboard', 'noDataValue'),
      inline: false,
    });
    return embed;
  }

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
    name: '​',
    value: leaderboardText,
    inline: false,
  });

  const totalBounties = stats.reduce((sum, user) => sum + user.totalBounties, 0);
  const totalXP = stats.reduce((sum, user) => sum + user.totalXP, 0);
  const totalUsers = stats.length;

  embed.addFields({
    name: t(locale, 'bountyleaderboard', 'statsField'),
    value: t(locale, 'bountyleaderboard', 'statsValue', {
      users: String(totalUsers),
      bounties: totalBounties.toLocaleString(),
      xp: totalXP.toLocaleString(),
    }),
    inline: false,
  });

  return embed;
}

function createSelectMenu(currentType: string, locale: string): StringSelectMenuBuilder {
  return new StringSelectMenuBuilder()
    .setCustomId('leaderboard_type')
    .setPlaceholder(t(locale, 'bountyleaderboard', 'selectMenuPlaceholder'))
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
    .setNameLocalizations(getCommandLocalizations('bountyleaderboard', 'commandName'))
    .setDescription(t('en-US', 'bountyleaderboard', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('bountyleaderboard', 'commandDescription'))
    .setIntegrationTypes([0])
    .addStringOption(option => option
      .setName('type')
      .setDescription(t('en-US', 'bountyleaderboard', 'typeOption'))
      .setDescriptionLocalizations(getCommandLocalizations('bountyleaderboard', 'typeOption'))
      .setRequired(false)
      .addChoices(
        { name: '🏆 Most Bounties Claimed', value: 'bounties' },
        { name: '⭐ Most XP Earned', value: 'xp' },
      )) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction): Promise<boolean> {
    try {
      const locale = await getLocale(interaction, 'bountyleaderboard');
      await interaction.deferReply();

      const leaderboardType = interaction.options.get('type')?.value as string || 'bounties';

      const embed = await generateLeaderboardEmbed(leaderboardType, interaction, locale);
      const selectMenu = createSelectMenu(leaderboardType, locale);
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      const response = await interaction.editReply({
        embeds: [embed],
        components: [row],
      });

      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 300_000,
      });

      collector.on('collect', async (selectInteraction: StringSelectMenuInteraction) => {
        if (selectInteraction.user.id !== interaction.user.id) {
          await selectInteraction.reply({
            content: t(locale, 'bountyleaderboard', 'onlyCommandUserError'),
            ephemeral: true,
          });
          return;
        }

        const newType = selectInteraction.values[0];
        const newEmbed = await generateLeaderboardEmbed(newType, interaction, locale);
        const newSelectMenu = createSelectMenu(newType, locale);
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
      const errorMessage = t('en-US', 'bountyleaderboard', 'errorMessage');

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
