/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */
import {
  // Colors,
  // EmbedBuilder,
  // Interaction,
  // GuildMember,
  SlashCommandBuilder,
  AttachmentBuilder,
} from 'discord.js';
import { experience_category, experience_type } from '@prisma/client';
import Canvas from '@napi-rs/canvas';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { getTotalLevel } from '../../../global/utils/experience';
import { getPersonaInfo } from '../../../global/commands/g.rpg';
import getAsset from '../../utils/getAsset';
import { resizeText, deFuckifyText, generateColors } from '../../utils/canvasUtils';
// import { paginationEmbed } from '../../utils/pagination';
import { leaderboardV2 } from '../../../global/commands/g.leaderboard';

const F = f(__filename);

const categoryChoices = [
  { name: 'Total Lvl', value: 'TOTAL' },
  { name: 'Chat Lvl', value: 'GENERAL' },
  { name: 'Voice Lvl', value: 'VOICE' },
  { name: 'Harm Reduction Lvl', value: 'TRIPSITTER' },
  { name: 'Development Lvl', value: 'DEVELOPER' },
  { name: 'Team Tripsit Lvl', value: 'TEAM' },
];

export const dLeaderboard: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the experience leaderboard')
    .addStringOption(option => option.setName('category')
      .setDescription('What category of experience?')
      .addChoices(
        { name: 'Total (Default)', value: 'TOTAL' },
        { name: 'Chat', value: 'GENERAL' },
        { name: 'Voice', value: 'VOICE' },
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
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(interaction) { // eslint-disable-line
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
    let categoryChoice = (interaction.options.getString('category') ?? 'TOTAL') as
      'TOTAL' | 'GENERAL' | 'VOICE' | 'TRIPSITTER' | 'DEVELOPER' | 'TEAM' | 'IGNORED';
    let typeChoice = 'ALL' as experience_type;
    // if the category choice is voice, set the type choice to voice (as to treat it as a category, not a type)
    if (categoryChoice === 'VOICE') {
      typeChoice = 'VOICE';
      categoryChoice = 'TOTAL';
    }
    categoryChoice = categoryChoice as experience_category;
    // const categoryValue = interaction.options.getString('category') ?? 'TOTAL';
    const categoryName = categoryChoices.find(choice => choice.value === categoryChoice)?.name || 'Total';

    context.font = resizeText(canvasObj, `${categoryName.toUpperCase()}`, 40, 'futura', 498);
    context.fillText(`${categoryName.toUpperCase()}`, 276, 54);

    // UPDATE THIS WHEN TIME PERIOD IS ADDED
    const timePeriod = 'ALL TIME';
    context.font = resizeText(canvasObj, `TOP OF ${timePeriod}`, 40, 'futura', 498);
    context.fillText(`TOP OF ${timePeriod}`, 276, 128);

    // const chatIcon = await Canvas.loadImage('https://i.gyazo.com/0f0a85e9fb0332d42e6e36e316886d98.png');
    // context.drawImage(chatIcon, 88, 54, 75, 75);

    await interaction.guild?.members.fetch();

    const leaderboardData = await leaderboardV2();

    // Directly access the selected type in the leaderboardData object
    const typeData = leaderboardData[typeChoice.toUpperCase() as keyof typeof leaderboardData];

    // Do this before the loops
    await interaction.guild.members.fetch();

    // Check if the typeData exists before proceeding
    if (typeData) {
      // Directly access the selected category in the typeData object
      const categoryData = typeData[categoryChoice.toUpperCase() as keyof typeof typeData];

      // Define the coordinates for the bars
      const barCoordinates = [
        {
          x: 18, y: 183, width: 516, height: 76,
        },
        {
          x: 18, y: 268, width: 516, height: 76,
        },
        {
          x: 18, y: 353, width: 516, height: 76,
        },
        {
          x: 570, y: 18, width: 333, height: 51,
        },
        {
          x: 570, y: 78, width: 333, height: 51,
        },
        {
          x: 570, y: 138, width: 333, height: 51,
        },
        {
          x: 570, y: 198, width: 333, height: 51,
        },
        {
          x: 570, y: 258, width: 333, height: 51,
        },
        {
          x: 570, y: 318, width: 333, height: 51,
        },
        {
          x: 570, y: 378, width: 333, height: 51,
        },
      ];

      // Check if the categoryData exists before proceeding
      if (categoryData) {
        let count = 0;
        let userCount = 0;
        // log.debug(F, `Category: ${categoryChoice} | Type: ${typeChoice}
        // | Count: ${count} | UserCount: ${userCount}`);
        // log.debug(F, `CategoryData: ${JSON.stringify(categoryData.length, null, 2)}`);
        while (count < 10) {
          const user = userCount < categoryData.length ? categoryData[userCount] : null;
          const avatarOffset = count > 2 ? 66 : 91;
          const bar = barCoordinates[count % barCoordinates.length];
          const rankFontSize = count > 2 ? (count === 9 ? 20 : 30) : 40; // eslint-disable-line no-nested-ternary
          // log.debug(F, `User: ${user?.discord_id} | Count: ${count} | UserCount: ${userCount}`);
          if (user) {
            // We only need to check the cache here because we already fetched all members above
            const member = interaction.guild?.members.cache.get(user.discord_id);
            if (member) {
              // log.debug(F, `Member: ${member?.displayName} | ${member?.roles.color?.id}`);
              const userLevel = await getTotalLevel(user.total_points);
              const roleColor = `#${(member.roles.color?.color || 0x99aab5).toString(16).padStart(6, '0')}`;
              const userDarkBarColor = generateColors(roleColor, 0, -72, -82);
              const userNameColor = generateColors(roleColor, 0, 0, 0);
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
                const inventoryData = await db.rpg_inventory.findMany({
                  where: {
                    persona_id: personaData.id,
                  },
                });
                // log.debug(F, `Persona home inventory (change): ${JSON.stringify(inventoryData, null, 2)}`);

                const equippedBackground = inventoryData.find(
                  item => item.equipped === true && item.effect === 'background',
                );
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
                  context.drawImage(Background, bar.x + avatarOffset, bar.y, bar.width - avatarOffset, bar.width - avatarOffset); // eslint-disable-line max-len
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
                context.fillStyle = '#ffffff';
              }
              context.textBaseline = 'middle';
              context.textAlign = 'left';
              context.font = `${rankFontSize}px futura`;
              context.fillText(`#${count + 1}`, bar.x - 9, bar.y + bar.height / 2);
              context.font = `${userFontSize}px futura`;
              // Draw the level number
              context.fillStyle = '#ffffff';
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
              const fontSize = userFontSize;
              const maxLength = (bar.width - (levelTextWidth + 18) - (18 + avatarOffset + (bar.height / 2)));
              context.font = `${fontSize}px ${userFont}`;
              context.fillStyle = userNameColor;
              context.font = resizeText(canvasObj, userName, fontSize, userFont, maxLength);
              context.textAlign = 'left';
              context.fillText(userName, bar.x + avatarOffset + (bar.height / 2) + 9, bar.y + bar.height / 2);

              count += 1;
            }
            userCount += 1;
          }
          //  else {
          // // Draw a plain bar without any user  data
          //   context.fillStyle = '#232323';
          //   context.beginPath();
          //   context.roundRect(bar.x + (avatarOffset - (bar.height / 2)),
          //  bar.y, bar.width - (avatarOffset - (bar.height / 2)),
          //  bar.height, [bar.height / 2, 19, 19, bar.height / 2]); // eslint-disable-line max-len
          //   context.fill();
          //   context.fillStyle = '#ffffff';
          //   context.textBaseline = 'middle';
          //   context.textAlign = 'left';
          //   context.font = `${rankFontSize}px futura`;
          //   if (count === 0) {
          //     context.fillStyle = '#d4af37';
          //   } else if (count === 1) {
          //     context.fillStyle = '#a8a9ad';
          //   } else if (count === 2) {
          //     context.fillStyle = '#aa7042';
          //   } else {
          //     context.fillStyle = '#ffffff';
          //   }
          //   context.fillText(`#${count + 1}`, bar.x - 9, bar.y + bar.height / 2);
          // }
          // count += 1;
        }
      }
    }

    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-'); // eslint-disable-line max-len
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), { name: `TS_Leaderboard_${categoryName}_${formattedDate}.png` }); // eslint-disable-line max-len
    await interaction.editReply({ files: [attachment] });

    log.info(F, `Total Time: ${Date.now() - startTime}ms`);
    return true;
  },
};

export default dLeaderboard;
