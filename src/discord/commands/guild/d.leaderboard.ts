/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */
import * as path from 'path';
import {
  Colors,
  EmbedBuilder,
  Interaction,
  // GuildMember,
  SlashCommandBuilder,
  AttachmentBuilder,
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
import Canvas from '@napi-rs/canvas';
import { getPersonaInfo } from '../../../global/commands/g.rpg';
import { inventoryGet } from '../../../global/utils/knex';
import getAsset from '../../utils/getAsset';
import { resizeText, deFuckifyText} from '../../utils/canvasUtils';

const F = f(__filename);

Canvas.GlobalFonts.registerFromPath(
  path.resolve(__dirname, '../../assets/Futura.otf'),
  'futura',
);

// type RankType = { 'rank': number, 'id': string, 'level': number };
// type LeaderboardType = {
//   [key: string]: RankType[],
// };

type ExpCategory = 'ALL' | 'TOTAL' | 'GENERAL' | 'TRIPSITTER' | 'DEVELOPER' | 'TEAM';

type ExpType = 'ALL' | 'TEXT' | 'VOICE';

type LeaderboardList = { discord_id: string, total_points: number }[];

type LeaderboardDataType = 'TEXT' | 'VOICE';

type LeaderboardData = {
  ALL: {
    TOTAL: LeaderboardList,
    TRIPSITTER: LeaderboardList,
    GENERAL: LeaderboardList,
    DEVELOPER: LeaderboardList,
    TEAM: LeaderboardList,
    IGNORED: LeaderboardList,
  },
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

const colorDefs = {
  [env.ROLE_PURPLE]: {
    cardDarkColor: '#19151e',
    cardLightColor: '#2d2636',
    chipColor: '#47335f',
    barColor: '#9661d9',
    textColor: '#b072ff',
  },
  [env.ROLE_BLUE]: {
    cardDarkColor: '#161d1f',
    cardLightColor: '#283438',
    chipColor: '#3a5760',
    barColor: '#4baccc',
    textColor: '#5acff5',
  },
  [env.ROLE_GREEN]: {
    cardDarkColor: '#151a16',
    cardLightColor: '#252e28',
    chipColor: '#31543d',
    barColor: '#59b879',
    textColor: '#6de194',
  },
  [env.ROLE_PINK]: {
    cardDarkColor: '#1e151b',
    cardLightColor: '#352530',
    chipColor: '#5f324f',
    barColor: '#d95dae',
    textColor: '#ff6dcd',
  },
  [env.ROLE_RED]: {
    cardDarkColor: '#1f1616',
    cardLightColor: '#382727',
    chipColor: '#613838',
    barColor: '#d95152',
    textColor: '#ff5f60',
  },
  [env.ROLE_ORANGE]: {
    cardDarkColor: '#1d1814',
    cardLightColor: '#342b24',
    chipColor: '#5f422e',
    barColor: '#d98b51',
    textColor: '#ffa45f',
  },
  [env.ROLE_YELLOW]: {
    cardDarkColor: '#1d1b14',
    cardLightColor: '#333024',
    chipColor: '#5e532d',
    barColor: '#a6903d',
    textColor: '#ffdd5d',
  },
  [env.ROLE_WHITE]: {
    cardDarkColor: '#242424',
    cardLightColor: '#404040',
    chipColor: '#666666',
    barColor: '#b3b3b3',
    textColor: '#dadada',
  },
  [env.ROLE_DONOR_BLACK]: {
    cardDarkColor: '#262626',
    cardLightColor: '#404040',
    chipColor: '#262626',
    barColor: '#595959',
    textColor: '#727272',
  },
  [env.ROLE_DONOR_PURPLE]: {
    cardDarkColor: '#1f1b25',
    cardLightColor: '#372e42',
    chipColor: '#432767',
    barColor: '#7f38d9',
    textColor: '#9542ff',
  },
  [env.ROLE_DONOR_BLUE]: {
    cardDarkColor: '#161d1f',
    cardLightColor: '#283438',
    chipColor: '#3a5760',
    barColor: '#1da2cc',
    textColor: '#22bef0',
  },
  [env.ROLE_DONOR_GREEN]: {
    cardDarkColor: '#1a211c',
    cardLightColor: '#2d3b32',
    chipColor: '#275c39',
    barColor: '#36b360',
    textColor: '#45e47b',
  },
  [env.ROLE_DONOR_PINK]: {
    cardDarkColor: '#261c23',
    cardLightColor: '#44303d',
    chipColor: '#682b52',
    barColor: '#d93fa4',
    textColor: '#ff4ac1',
  },
  [env.ROLE_DONOR_RED]: {
    cardDarkColor: '#241b1b',
    cardLightColor: '#412e2e',
    chipColor: '#662526',
    barColor: '#d93335',
    textColor: '#ff3c3e',
  },
  [env.ROLE_DONOR_ORANGE]: {
    cardDarkColor: '#241f1b',
    cardLightColor: '#41362e',
    chipColor: '#664225',
    barColor: '#d96c36',
    textColor: '#ff913b',
  },
  [env.ROLE_DONOR_YELLOW]: {
    cardDarkColor: '#23211a',
    cardLightColor: '#3f3b2c',
    chipColor: '#655721',
    barColor: '#d9bc4f',
    textColor: '#ffd431',
  },
} as {
  [key: string]: {
    cardDarkColor: string;
    cardLightColor: string;
    chipColor: string;
    barColor: string;
    textColor: string;
  };
};

const categoryChoices = [
  { name: 'Total Lvl', value: 'TOTAL' },
  { name: 'Chat Lvl', value: 'GENERAL' },
  { name: 'Voice Lvl', value: 'VOICE'},
  { name: 'Harm Reduction Lvl', value: 'TRIPSITTER' },
  { name: 'Development Lvl', value: 'DEVELOPER' },
  { name: 'Team Tripsit Lvl', value: 'TEAM' },
];

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

async function createLeaderboard(
  interaction: Interaction,
  leaderboardData: LeaderboardData,
  typeChoice: 'TEXT' | 'VOICE' | 'ALL',
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
      .setDescription('What category of experience?')
      .addChoices(
        { name: 'Total (Default)', value: 'TOTAL' },
        { name: 'Chat', value: 'GENERAL' },
        { name: 'Voice', value: 'VOICE'},
        { name: 'Harm Reduction', value: 'TRIPSITTER' },
        { name: 'Development', value: 'DEVELOPER' },
        { name: 'Team Tripsit', value: 'TEAM' },
      ))
    // .addStringOption(option => option.setName('time')
    //   .setDescription('What time period?')
    //   .addChoices(
    //     { name: 'All Time (Default)', value: 'ALL' },
    //     { name: 'Yearly', value: 'YEAR' },
    //     { name: 'Monthly', value: 'MONTH' },
    //     { name: 'Weekly', value: 'WEEK' },
    //   ))
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

    // Choose color based on user's role
    // const cardLightColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardLightColor || '#232323';
    // const cardDarkColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardDarkColor || '#141414';
    // const chipColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.chipColor || '#393939';
    // const barColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.barColor || '#b3b3b3';
    // const textColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.textColor || '#ffffff';

    const canvasWidth = 921;
    const canvasHeight = 447;
    const canvasObj = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvasObj.getContext('2d');

    context.fillStyle = '#181818';
    context.beginPath();
    context.roundRect(0, 0, 921, 447, [19]);
    context.fill();
    context.fillStyle = '#0e0e0e';
    context.beginPath();
    context.roundRect(0, 0, 552, 447, [19]);
    context.fill();
    context.fillStyle = '#262626';
    context.beginPath();
    context.roundRect(18, 18, 516, 69, [19]);
    context.roundRect(18, 94, 516, 69, [19]);
    context.fill();

    context.fillStyle = '#FFFFFF';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    let categoryChoice = interaction.options.getString('category') ?? 'TOTAL';
    let typeChoice = 'ALL' as ExpType;
    // if the category choice is voice, set the type choice to voice (as to treat it as a category, not a type)
    if (categoryChoice === 'VOICE') {
      typeChoice = 'VOICE';
    }
    // if the category choice is voice, set the category choice to total (as to treat it as a category, not a type)
    if (categoryChoice === 'VOICE') {
      categoryChoice = 'TOTAL';
    }
    categoryChoice = categoryChoice as ExpCategory;
    const categoryValue = interaction.options.getString('category') ?? 'TOTAL';
    const categoryName = categoryChoices.find(choice => choice.value === categoryValue)?.name || 'Total';

    context.font = resizeText(canvasObj, `${categoryName.toUpperCase()}`, 40, 'futura', 498);
    context.fillText(`${categoryName.toUpperCase()}`, 276, 54);
    
    // UPDATE THIS WHEN TIME PERIOD IS ADDED
    const timePeriod = 'ALL TIME';
    context.font = resizeText(canvasObj, `TOP OF ${timePeriod}`, 40, 'futura', 498);
    context.fillText(`TOP OF ${timePeriod}`, 276, 128);

    // const chatIcon = await Canvas.loadImage('https://i.gyazo.com/0f0a85e9fb0332d42e6e36e316886d98.png');
    // context.drawImage(chatIcon, 88, 54, 75, 75);

    await interaction.guild?.members.fetch();
    const leaderboardData = await getLeaderboard();

    // Directly access the selected type in the leaderboardData object
    const typeData = leaderboardData[typeChoice.toUpperCase() as keyof typeof leaderboardData];

    // Check if the typeData exists before proceeding
    if (typeData) {
      // Directly access the selected category in the typeData object
      const categoryData = typeData[categoryChoice.toUpperCase() as keyof typeof typeData];
      
      // Define the coordinates for the bars
      const barCoordinates = [
        { x: 18, y: 183, width: 516, height: 76 },
        { x: 18, y: 268, width: 516, height: 76 },
        { x: 18, y: 353, width: 516, height: 76 },
        { x: 570, y: 18, width: 333, height: 51 },
        { x: 570, y: 78, width: 333, height: 51 },
        { x: 570, y: 138, width: 333, height: 51 },
        { x: 570, y: 198, width: 333, height: 51 },
        { x: 570, y: 258, width: 333, height: 51 },
        { x: 570, y: 318, width: 333, height: 51 },
        { x: 570, y: 378, width: 333, height: 51 },
      ];

      // Check if the categoryData exists before proceeding
      if (categoryData) {
        let count = 0;
        let userCount = 0;
        while (count < 10) {
          const user = userCount < categoryData.length ? categoryData[userCount] : null;
          const avatarOffset = count > 2 ? 66 : 91;
          const bar = barCoordinates[count % barCoordinates.length];
          const rankFontSize = count > 2 ? (count === 9 ? 20 : 30) : 40;
          if (user) {
            const memberCollection = interaction.guild?.members.cache.filter(m => m.id === user.discord_id);
            if (memberCollection && memberCollection.size > 0) {
            const member = memberCollection.first(); // Get the first member from the collection
            const userLevel = await getTotalLevel(user.total_points);
            const userDarkBarColor = colorDefs[member?.roles.color?.id as keyof typeof colorDefs]?.cardDarkColor || '#232323';
            const userNameColor = colorDefs[member?.roles.color?.id as keyof typeof colorDefs]?.textColor || '#ffffff';
            const userName = await deFuckifyText(member?.displayName || '');
            const userFontSize = count > 2 ? 25 : 35;
            const personaData = await getPersonaInfo(user.discord_id);
            
            // Draw the under bar
            context.fillStyle = userDarkBarColor;
            context.beginPath();
            context.roundRect(bar.x + avatarOffset, bar.y, bar.width - avatarOffset, bar.height, [0, 19, 19, 0]);
            context.fill();

            let userFont = 'futura';
            let levelTextWidth = 0;
            if (personaData) {
              // Get the existing inventory data
              const inventoryData = await inventoryGet(personaData.id);
              // log.debug(F, `Persona home inventory (change): ${JSON.stringify(inventoryData, null, 2)}`);
        
              const equippedBackground = inventoryData.find(item => item.equipped === true && item.effect === 'background');
              const equippedFont = inventoryData.find(item => item.equipped === true && item.effect === 'font');
              if (equippedFont) {
                await getAsset(equippedFont.value);
                userFont = equippedFont.value;
              }

              if (equippedBackground) {
                const imagePath = await getAsset(equippedBackground.value);
                const Background = await Canvas.loadImage(imagePath);
                context.save();
                context.globalCompositeOperation = 'lighter';
                context.globalAlpha = 0.05;
                context.beginPath();
                // Make a clip for the users bar
                context.roundRect(bar.x + avatarOffset, bar.y, bar.width - avatarOffset, bar.height, [19]);
                context.clip();
                // Draw the background based off the bar width
                context.drawImage(Background, bar.x + avatarOffset, bar.y, bar.width - avatarOffset, bar.width - avatarOffset);
                context.restore();

              }
            }
            // Calculate the width of the level text to determine the username's font size later
            context.font = `${userFontSize}px futura`;
            levelTextWidth = context.measureText(`${userLevel.level}`).width;

            // Draw the rank number
            // If rank is 1-3, change the color to gold, silver, or bronze
            if (count === 0) {
              context.fillStyle = '#d4af37';
            } else if (count === 1) {
              context.fillStyle = '#a8a9ad';
            } else if (count === 2) {
              context.fillStyle = '#aa7042';
            } else {
              context.fillStyle = `#ffffff`;
            }
            context.textBaseline = 'middle';
            context.textAlign = 'left';
            context.font = `${rankFontSize}px futura`;
            context.fillText(`#${count + 1}`, bar.x - 9, bar.y + bar.height / 2);
            context.font = `${userFontSize}px futura`;
            // Draw the level number
            context.fillStyle = `#ffffff`;
            context.globalAlpha = 0.60;
            context.textAlign = 'right';
            context.fillText(`${userLevel.level}`, bar.x + bar.width - 9, bar.y + bar.height / 2);
            context.fillStyle = `${userNameColor}`;
            context.globalAlpha = 1;

            // Draw the user's avatar in a circle to the right of the rank number, with a radius of bar.height
            const avatar = await Canvas.loadImage(member?.displayAvatarURL({ extension: 'jpg' }) || '');
            context.save();
            context.beginPath();
            context.arc(bar.x + avatarOffset, bar.y + bar.height / 2, bar.height / 2, 0, Math.PI * 2, true);
            context.closePath();
            context.clip();
            context.drawImage(avatar, bar.x + avatarOffset - bar.height / 2, bar.y, bar.height, bar.height);
            context.restore();
            // Draw the user's name to the right of the avatar
            // Username Text Resize to fit
            let fontSize = userFontSize;
            let maxLength = (bar.width - (levelTextWidth + 18) - (18 + avatarOffset + (bar.height / 2)));
            context.font = `${fontSize}px ${userFont}`;
            context.fillStyle = userNameColor;
            context.font = resizeText(canvasObj, userName, fontSize, userFont, maxLength);
            context.textAlign = 'left';
            context.fillText(userName, bar.x + avatarOffset + (bar.height / 2) + 9, bar.y + bar.height / 2);
          }
          userCount++;
        } else {
          // Draw a plain bar without any user data
          context.fillStyle = '#232323';
          context.beginPath();
          context.roundRect(bar.x + (avatarOffset - (bar.height / 2)), bar.y, bar.width - (avatarOffset - (bar.height / 2)), bar.height, [bar.height / 2, 19, 19, bar.height / 2]);
          context.fill();
          context.fillStyle = '#ffffff';
          context.textBaseline = 'middle';
          context.textAlign = 'left';
          context.font = `${rankFontSize}px futura`;
          if (count === 0) {
            context.fillStyle = '#d4af37';
          } else if (count === 1) {
            context.fillStyle = '#a8a9ad';
          } else if (count === 2) {
            context.fillStyle = '#aa7042';
          } else {
            context.fillStyle = `#ffffff`;
          }
          context.fillText(`#${count + 1}`, bar.x - 9, bar.y + bar.height / 2);
        }
        count++;
      }
    }
  }


    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), { name: `TS_Leaderboard_${categoryName}_${formattedDate}.png` });
    await interaction.editReply({ files: [attachment] });

    log.info(F, `Total Time: ${Date.now() - startTime}ms`);
    return true;
  },
};

export default dLeaderboard;
