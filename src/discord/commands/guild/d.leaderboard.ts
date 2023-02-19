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
        { name: 'Developer', value: 'Development' },
        { name: 'Team Tripsit', value: 'Team' },
        { name: 'Ignored', value: 'Ignored' },
      ))
    .addStringOption(option => option.setName('type')
      .setDescription('What type of experience? (Default: All)')
      .addChoices(
        { name: 'Text', value: 'Text' },
        { name: 'Voice', value: 'Voice' },
      )),
  async execute(interaction) {
    const startTime = Date.now();
    if (!interaction.guild) {
      interaction.reply('You can only use this command in a guild!');
      return false;
    }
    startLog(F, interaction);

    await interaction.deferReply();
    const categoryChoice = interaction.options.getString('category') ?? 'All';
    const typeChoice = interaction.options.getString('type') ?? 'All';
    log.debug(F, `categoryChoice: ${categoryChoice}, typeChoice: ${typeChoice}`);

    const leaderboardData = await getLeaderboard();
    const book = [];

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
        const descriptionText = await Promise.all(categoryData.map(async (user, index) => {
          const levelData = await getTotalLevel(user.total_points);
          return `#${index + 1} Lvl ${levelData.level} <@${user.discord_id}> (${user.total_points} XP)`;
        }));

        // Lowercase everything and then capitalize the first letter of type and category
        const categoryString = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        const typeString = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

        const embed = embedTemplate()
          .setTitle(`${typeString} ${categoryString} Leaderboard!`)
          .setColor(Colors.Gold)
          .setDescription(descriptionText.join('\n'));

        book.push(embed);
      }
    }

    paginationEmbed(interaction, book, buttonList, 0);
    log.info(F, `Total Time: ${Date.now() - startTime}ms`);
    return true;
  },
};
