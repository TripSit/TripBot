/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */

import {
  ButtonBuilder,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  Interaction,
  // GuildMember,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import {
  getLeaderboard,
  // leaderboard,
} from '../../../global/commands/g.leaderboard';
import commandContext from '../../utils/context';
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

type ExpCategory = 'ALL' | 'TOTAL' | 'GENERAL' | 'TRIPSITTER' | 'DEVELOPER' | 'TEAM';

type ExpType = 'ALL' | 'TEXT' | 'VOICE';

type LeaderboardList = { discord_id: string, total_points: number }[];

type LeaderboardDataType = 'TEXT' | 'VOICE';

type LeaderboardData = {
  TEXT: {
    TOTAL: LeaderboardList,
    TRIPSITTER: LeaderboardList,
    GENERAL: LeaderboardList,
    DEVELOPER: LeaderboardList,
    TEAM: LeaderboardList,
    IGNORED: LeaderboardList,
  },
  VOICE: {
    TOTAL: LeaderboardList,
    TRIPSITTER: LeaderboardList,
    GENERAL: LeaderboardList,
    DEVELOPER: LeaderboardList,
    TEAM: LeaderboardList,
    IGNORED: LeaderboardList,
  },
};

type NewLeaderboardData = {
  TOTAL: LeaderboardList,
  TRIPSITTER: LeaderboardList,
  GENERAL: LeaderboardList,
  DEVELOPER: LeaderboardList,
  TEAM: LeaderboardList,
  IGNORED: LeaderboardList,
};

async function createBook(
  interaction: Interaction,
  data: LeaderboardData[keyof LeaderboardData],
  typeChoice: LeaderboardDataType | undefined,
  categoryChoice: ExpCategory,
):Promise<EmbedBuilder[]> {
  const book = [] as EmbedBuilder[];
  for (const category of Object.keys(data)) {
    if (categoryChoice && categoryChoice !== 'ALL' && categoryChoice.toUpperCase() !== category) {
      continue;
    }
    const categoryKey = category as keyof typeof data;
    const categoryData = data[categoryKey];
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
    const typeString = typeChoice ? `${typeChoice.charAt(0).toUpperCase()}${typeChoice.slice(1).toLowerCase()} `
      : typeChoice;

    const embed = embedTemplate()
      .setTitle(`${typeString ?? ''}${categoryString} Leaderboard!`)
      .setColor(Colors.Gold)
      .setDescription(filteredList.join('\n'));

    book.push(embed);
  }
  return book;
}

async function combineLeaderboardData(
  interaction: Interaction,
  leaderboardData: LeaderboardData,
  categoryChoice: ExpCategory,
):Promise<EmbedBuilder[]> {
  const combinedLeaderboard: NewLeaderboardData = {
    TOTAL: [],
    TRIPSITTER: [],
    GENERAL: [],
    DEVELOPER: [],
    TEAM: [],
    IGNORED: [],
  };

  const book = [];

  // Go through each category
  for (const category in combinedLeaderboard) { // eslint-disable-line no-restricted-syntax
    if (!Object.prototype.hasOwnProperty.call(combinedLeaderboard, category)) {
      continue; // eslint-disable-line no-continue
    }

    // Go through each Text experience record for that category
    for (const textData of leaderboardData.TEXT[category as keyof typeof leaderboardData.TEXT]) {
      // if (textData.discord_id !== '271857135350972416' && textData.discord_id !== '577467602897600522') {
      //   continue;
      // }

      // Find if that user exists in the leaderboardData.VOICE for that category
      const voiceData = leaderboardData.VOICE[category as keyof typeof leaderboardData.VOICE]
        .find(user => user.discord_id === textData.discord_id);

      const totalPoints = Number(textData.total_points) + Number((voiceData?.total_points ?? 0));

      // if (textData.discord_id === '271857135350972416') log.debug(F, `totalPoints (${category}): ${totalPoints}`);

      // Combine the two data, and add that to the combinedLeaderboard for that category
      combinedLeaderboard[category as keyof typeof combinedLeaderboard].push({
        discord_id: textData.discord_id,
        total_points: totalPoints,
      });

      if (textData.discord_id === '271857135350972416' || textData.discord_id === '577467602897600522') {
        log.debug(F, `Pushed to ${category} leaderboard: ${JSON.stringify({
          discord_id: textData.discord_id,
          total_points: totalPoints,
        })}`);
      }
    }
    // Go through each remaining Voice experience record for that category
    for (const voiceData of leaderboardData.VOICE[category as keyof typeof leaderboardData.VOICE]) {
      // Find if that user exists in the combinedLeaderboard for that category, and if so, skip this record
      const combinedData = combinedLeaderboard[category as keyof typeof combinedLeaderboard]
        .find(user => user.discord_id === voiceData.discord_id);
      if (combinedData) {
        continue;
      }

      // Add the voiceData to the combinedLeaderboard for that category
      combinedLeaderboard[category as keyof typeof combinedLeaderboard].push({
        discord_id: voiceData.discord_id,
        total_points: voiceData.total_points,
      });
    }
  }

  book.push(...await createBook(interaction, combinedLeaderboard, undefined, categoryChoice));

  return book;
}

async function createLeaderboard(
  interaction: Interaction,
  leaderboardData: LeaderboardData,
  typeChoice: 'TEXT' | 'VOICE',
  categoryChoice: ExpCategory,
):Promise<EmbedBuilder[]> {
  const book = [] as EmbedBuilder[];
  for (const type of Object.keys(leaderboardData) as LeaderboardDataType[]) {
    if (typeChoice.toUpperCase() !== type) {
      continue; // eslint-disable-line no-continue
    }
    const typeData = leaderboardData[type];
    // log.debug(F, `typeKey: ${typeKey}, typeData: ${JSON.stringify(typeData, null, 2)}`);
    book.push(...await createBook(interaction, typeData, type, categoryChoice));
  }
  return book;
}

export const dLeaderboard: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the experience leaderboard')
    .addStringOption(option => option.setName('category')
      .setDescription('What category of experience? (Default: All)')
      .addChoices(
        { name: 'Total', value: 'TOTAL' },
        { name: 'General', value: 'GENERAL' },
        { name: 'Tripsitter', value: 'TRIPSITTER' },
        { name: 'Developer', value: 'DEVELOPER' },
        { name: 'Team Tripsit', value: 'TEAM' },
      ))
    .addStringOption(option => option.setName('type')
      .setDescription('What type of experience? (Default: All)')
      .addChoices(
        { name: 'Text', value: 'TEXT' },
        { name: 'Voice', value: 'VOICE' },
      ))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const startTime = Date.now();
    if (!interaction.guild) {
      await interaction.editReply('You can only use this command in a guild!');
      return false;
    }

    const categoryChoice = (interaction.options.getString('category')
      ?? 'ALL') as ExpCategory;
    const typeChoice = (interaction.options.getString('type')
      ?? 'ALL') as ExpType;
    log.debug(F, `categoryChoice: ${categoryChoice}, typeChoice: ${typeChoice}`);

    const leaderboardData = await getLeaderboard();
    const book: EmbedBuilder[] = [];

    await interaction.guild?.members.fetch();

    if (typeChoice === 'ALL') {
      book.push(...await combineLeaderboardData(interaction, leaderboardData, categoryChoice));
    } else {
      book.push(...await createLeaderboard(interaction, leaderboardData, typeChoice, categoryChoice));
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

export default dLeaderboard;
