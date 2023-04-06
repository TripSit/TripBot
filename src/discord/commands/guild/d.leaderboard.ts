/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */

import {
  ButtonBuilder,
  ButtonStyle,
  Colors,
  // GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import {
  getLeaderboard,
  // leaderboard,
} from '../../../global/commands/g.leaderboard';
import { startLog } from '../../utils/startLog';
import { embedTemplate } from '../../utils/embedTemplate'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { getTotalLevel } from '../../../global/utils/experience';
import { paginationEmbed } from '../../utils/pagination';

const F = f(__filename);

const button1 = new ButtonBuilder()
  .setCustomId('previousButton')
  .setLabel('Previous')
  .setStyle(ButtonStyle.Danger);

const button2 = new ButtonBuilder()
  .setCustomId('nextButton')
  .setLabel('Next')
  .setStyle(ButtonStyle.Success);

const buttonList = [
  button1,
  button2,
];

// type RankType = { 'rank': number, 'id': string, 'level': number };
// type LeaderboardType = {
//   [key: string]: RankType[],
// };

export default dLeaderboard;

export const dLeaderboard: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the experience leaderboard')
    .addStringOption(option => option.setName('category')
      .setDescription('What category of experience? (Default: All)')
      .addChoices(
        { name: 'Total', value: 'Total' },
        { name: 'General', value: 'General' },
        { name: 'Tripsitter', value: 'Tripsitter' },
        { name: 'Developer', value: 'Developer' },
        { name: 'Team Tripsit', value: 'Team' },
        { name: 'Ignored', value: 'Ignored' },
      ))
    .addStringOption(option => option.setName('type')
      .setDescription('What type of experience? (Default: All)')
      .addChoices(
        { name: 'Text', value: 'Text' },
        { name: 'Voice', value: 'Voice' },
      ))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const startTime = Date.now();
    if (!interaction.guild) {
      await interaction.editReply('You can only use this command in a guild!');
      return false;
    }

    const categoryChoice = interaction.options.getString('category') ?? 'All';
    const typeChoice = interaction.options.getString('type') ?? 'All';
    // log.debug(F, `categoryChoice: ${categoryChoice}, typeChoice: ${typeChoice}`);

    const leaderboardData = await getLeaderboard();
    const book = [];

    await interaction.guild?.members.fetch();

    for (const type of Object.keys(leaderboardData)) { // eslint-disable-line no-restricted-syntax
      if (typeChoice !== 'All' && typeChoice.toUpperCase() !== type) {
        continue; // eslint-disable-line no-continue
      }
      const typeKey = type as keyof typeof leaderboardData;
      const typeData = leaderboardData[typeKey];
      // log.debug(F, `typeKey: ${typeKey}, typeData: ${JSON.stringify(typeData, null, 2)}`);
      for (const category of Object.keys(typeData)) {
        if (categoryChoice !== 'All' && categoryChoice.toUpperCase() !== category) {
          continue;
        }
        const categoryKey = category as keyof typeof typeData;
        const categoryData = typeData[categoryKey];
        // log.debug(F, `categoryKey: ${categoryKey}, categoryData: ${JSON.stringify(categoryData, null, 2)}`);
        if (categoryData.length === 0) {
          continue;
        }
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        const descriptionText = await Promise.all(categoryData.map(async user => {
          const member = interaction.guild?.members.cache.filter(m => m.id === user.discord_id);
          if (member && member.size > 0) {
            const levelData = await getTotalLevel(user.total_points);
            return `Lvl ${levelData.level} <@${user.discord_id}> (${user.total_points} XP)`;
          }
          return null;
        }));

        // prune null values, add rank #, and limit to 10
        const filteredList = descriptionText
          .filter(value => value !== null)
          .map((value, index) => `#${index + 1} ${value}`)
          .slice(0, 20);

        // Lowercase everything and then capitalize the first letter of type and category
        const categoryString = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        const typeString = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

        const embed = embedTemplate()
          .setTitle(`${typeString} ${categoryString} Leaderboard!`)
          .setColor(Colors.Gold)
          .setDescription(filteredList.join('\n'));

        book.push(embed);
      }
    }

    if (book.length === 0) {
      await interaction.editReply(`No ${typeChoice} ${categoryChoice} found!`);
      return false;
    }

    if (book.length === 1) {
      await interaction.editReply({ embeds: [book[0]] });
      return true;
    }

    paginationEmbed(interaction, book, buttonList, 0);
    log.info(F, `Total Time: ${Date.now() - startTime}ms`);
    return true;
  },
};
