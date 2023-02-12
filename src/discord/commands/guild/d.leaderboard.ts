import {
  SlashCommandBuilder,
  // ChatInputCommandInteraction,
  // UserContextMenuCommandInteraction,
  // GuildMember,
  AttachmentBuilder,
} from 'discord.js';
import Canvas from '@napi-rs/canvas';
import * as path from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { getLeaderboard } from '../../../global/commands/g.leaderboard';
import { startLog } from '../../utils/startLog';
import { getPersonaInfo } from '../../../global/commands/g.rpg';
import { inventoryGet } from '../../../global/utils/knex';
import { imageGet } from '../../utils/imageGet';

export default dLeaderboard;

const F = f(__filename);

Canvas.GlobalFonts.registerFromPath(
  path.resolve(__dirname, '../../assets/Futura.otf'),
  'futura',
);

export const dLeaderboard: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the experience leaderboard')
    .addStringOption(option => option.setName('category')
      .setDescription('Which category? (Default: Total)')
      .addChoices(
        { name: 'Total', value: 'TOTAL' },
        { name: 'Chat', value: 'GENERAL' },
        { name: 'Harm Reduction', value: 'TRIPSITTER' },
        { name: 'Development', value: 'DEVELOPER' },
        { name: 'Team Tripsit', value: 'TEAM' },
      )),
  async execute(interaction) {
    const startTime = Date.now();
    if (!interaction.guild) {
      interaction.reply('You can only use this command in a guild!');
      return false;
    }
    startLog(F, interaction);
    await interaction.deferReply();

    const categoryName = interaction.options.getString('category') ?? 'Total';
    const categoryValue = categoryName.toLowerCase();

    // Create Canvas and Context
    const canvasWidth = 921;
    const canvasHeight = 402;
    const canvasObj = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvasObj.getContext('2d');

    // Draw the card shape
    context.fillStyle = '#232323';
    context.beginPath();
    context.roundRect(0, 20, 921, 382, [19]);
    context.fill();
    context.fillStyle = '#141414';
    context.beginPath();
    context.roundRect(0, 0, 921, 255, [19]);
    context.fill();

    // Category Title Text
    context.font = '40px futura';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.fillText(`TOP 10 - ${categoryName}`, 460, 47);

    // Get the leaderboard data from the db:
    const leaderboardData = await getLeaderboard(categoryName.toUpperCase() as 'TOTAL' | 'GENERAL' | 'TRIPSITTER' | 'DEVELOPER' | 'TEAM'); // eslint-disable-line

    // Get the guild object from the client, do this outside the loop to save memory
    const tripsitGuild = await interaction.client.guilds.fetch(env.DISCORD_GUILD_ID); // eslint-disable-line

    // Loop through the leaderboard data, first by the Type (text/voice)
    for (const [type, typeData] of Object.entries(leaderboardData)) { // eslint-disable-line
      log.debug(F, `Type: ${type}`);
      // Loop through the individual category's rank data
      for (const [category, rankDataList] of Object.entries(typeData)) { // eslint-disable-line
        // If the user chose a category, and the category we're on doesn't match the category they chose, skip it
        if (categoryValue !== category) continue; // eslint-disable-line
        log.debug(F, `Category: ${category}`);
        // Initialize rank at 0 so we can increment it
        let rank = 0;
        let rankPositions = 0;
        // Loop through the rank data list
        for (const rankData of rankDataList) { // eslint-disable-line
          // Increment the rank
          rank += 1;
          rankPositions += 1;

          // log.debug(F, `rankData: ${JSON.stringify(rankData, null, 2)}`);

          // Get the discord member object from the guild object
          const member = env.NODE_ENV === 'production'
          ? await tripsitGuild.members.fetch(rankData.discordId) // eslint-disable-line
            : {
              id: '1234567890',
              roles: {
                color: {
                  id: '1234567890',
                },
              },
              user: {
                displayAvatarURL: () => 'https://cdn.discordapp.com/avatars/177537158419054592/a156668bbfd7e4f70a505fef639a75f5.webp', // eslint-disable-line
              },
              displayName: 'Test User',
            };

          // log.debug(F, `member: ${JSON.stringify(member, null, 2)}`);

          // Draw basically everything else
          context.textBaseline = 'middle';
          // Choose color based on user's role
          const cardLightColor = colorDefs[member.roles.color?.id as keyof typeof colorDefs]?.cardLightColor || '#141414'; // eslint-disable-line
          const textColor = colorDefs[member.roles.color?.id as keyof typeof colorDefs]?.textColor || '#ffffff';
          context.save();

          if (rankPositions <= 4) {
            // Draw Chip
            if (rankPositions === 1) {
              context.translate(18, 76);
            } else if (rankPositions === 2) {
              context.translate(469, 76);
            } else if (rankPositions === 3) {
              context.translate(18, 161);
            } else if (rankPositions === 4) {
              context.translate(469, 161);
            }

            context.fillStyle = cardLightColor;
            context.beginPath();
            context.roundRect(0, 0, 428, 76, [19]);
            context.fill();

            // Purchased Background
            // Check get fresh persona data
            const [personaData] = await getPersonaInfo(member.id); // eslint-disable-line

            if (personaData) {
              // Get the existing inventory data
              const inventoryData = await inventoryGet(personaData.id); // eslint-disable-line
              // log.debug(F, `Persona home inventory (change): ${JSON.stringify(inventoryData, null, 2)}`);

              const equippedBackground = inventoryData.find(item => item.equipped === true);
              log.debug(F, `equippedBackground: ${JSON.stringify(equippedBackground, null, 2)} `);
              if (equippedBackground) {
                const imagePath = await imageGet(equippedBackground.value); // eslint-disable-line
                const Background = await Canvas.loadImage(imagePath); // eslint-disable-line
                context.save();
                context.globalCompositeOperation = 'lighter';
                context.globalAlpha = 0.03;
                context.beginPath();
                context.roundRect(0, 0, 428, 76, [19]);
                context.clip();
                context.drawImage(Background, 0, 0, 500, 500);
                context.restore();
              }
            }
            // Draw Rank Number
            context.fillStyle = textColor;
            context.font = '30px futura';
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            context.fillText(`#${rank}`, 9, 38);
            // Draw Profile Picture
            const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'jpg' })); // eslint-disable-line
            context.save();
            context.beginPath();
            context.arc(103, 38, 38, 0, Math.PI * 2, true);
            context.closePath();
            context.clip();
            context.drawImage(avatar, 65, 0, 76, 76);
            context.restore();
            // Draw Username
            const applyUsername = (canvas:Canvas.Canvas, text:string) => {
              const usernameContext = canvas.getContext('2d');
              let fontSize = 30;
              do {
                fontSize -= 2;
                usernameContext.font = `${fontSize}px futura`;
              } while (usernameContext.measureText(text).width > 225);
              return usernameContext.font;
            };
            context.save();
            context.font = applyUsername(canvasObj, `${member.displayName}`);
            context.fillStyle = textColor;
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            context.fillText(`${member.displayName}`, 152, 38);
            context.restore();
            // Draw Level Number
            context.fillStyle = textColor;
            context.textAlign = 'right';
            context.fillText(`${rankData.level}`, 417, 38);
            context.restore();
          } else if (rankPositions > 4) {
            // Draw Chip
            if (rankPositions === 5) {
              context.translate(18, 273);
            } else if (rankPositions === 6) {
              context.translate(307, 273);
            } else if (rankPositions === 7) {
              context.translate(614, 273);
            } else if (rankPositions === 8) {
              context.translate(18, 342);
            } else if (rankPositions === 9) {
              context.translate(307, 342);
            } else if (rankPositions === 10) {
              context.translate(614, 342);
            }

            context.fillStyle = cardLightColor;
            context.beginPath();
            context.roundRect(0, 0, 289, 51, [19]);
            context.fill();

            // Draw Rank Number
            context.fillStyle = textColor;
            context.font = '25px futura';
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            context.fillText(`#${rank}`, 9, 38);
            // Draw Profile Picture
            const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'jpg' })); // eslint-disable-line
            context.save();
            context.beginPath();
            context.arc(94, 25, 25, 0, Math.PI * 2, true);
            context.closePath();
            context.clip();
            context.drawImage(avatar, 25, 0, 51, 51);
            context.restore();
            // Draw Username
            const applyUsername = (canvas:Canvas.Canvas, text:string) => {
              const usernameContext = canvas.getContext('2d');
              let fontSize = 30;
              do {
                fontSize -= 2;
                usernameContext.font = `${fontSize}px futura`;
              } while (usernameContext.measureText(text).width > 90);
              return usernameContext.font;
            };
            context.save();
            context.font = applyUsername(canvasObj, `${member.displayName}`);
            context.fillStyle = textColor;
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            context.fillText(`${member.displayName}`, 143, 22);
            context.restore();
            // Draw Level Number
            context.fillStyle = textColor;
            context.textAlign = 'right';
            context.fillText(`${rankData.level}`, 280, 22);
            context.restore();
          }
        }
      }
    }

    // Process The Entire Card and Send it to Discord
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), { name: 'tripsit-levels-image.png' });
    interaction.editReply({ files: [attachment] });

    log.debug(F, `Finished in ${Date.now() - startTime}ms`);
    return true;
  },
};

const colorDefs = {
  [env.ROLE_PURPLE]: {
    cardDarkColor: '#19151e',
    cardLightColor: '#2d2636',
    chipColor: '#47335f',
    textColor: '#b072ff',
  },
  [env.ROLE_BLUE]: {
    cardDarkColor: '#161d1f',
    cardLightColor: '#283438',
    chipColor: '#3a5760',
    textColor: '#5acff5',
  },
  [env.ROLE_GREEN]: {
    cardDarkColor: '#151a16',
    cardLightColor: '#252e28',
    chipColor: '#31543d',
    textColor: '#6de194',
  },
  [env.ROLE_PINK]: {
    cardDarkColor: '#1e151b',
    cardLightColor: '#352530',
    chipColor: '#5f324f',
    textColor: '#ff6dcd',
  },
  [env.ROLE_RED]: {
    cardDarkColor: '#1f1616',
    cardLightColor: '#382727',
    chipColor: '#613838',
    textColor: '#ff5f60',
  },
  [env.ROLE_ORANGE]: {
    cardDarkColor: '#1d1814',
    cardLightColor: '#342b24',
    chipColor: '#5f422e',
    textColor: '#ffa45f',
  },
  [env.ROLE_YELLOW]: {
    cardDarkColor: '#1d1b14',
    cardLightColor: '#333024',
    chipColor: '#5e532d',
    textColor: '#ffdd5d',
  },
  [env.ROLE_WHITE]: {
    cardDarkColor: '#242424',
    cardLightColor: '#404040',
    chipColor: '#666666',
    textColor: '#dadada',
  },
  [env.ROLE_BLACK]: {
    cardDarkColor: '#0e0e0e',
    cardLightColor: '#181818',
    chipColor: '#262626',
    textColor: '#626262',
  },
  [env.ROLE_DONOR_PURPLE]: {
    cardDarkColor: '#1f1b25',
    cardLightColor: '#372e42',
    chipColor: '#432767',
    textColor: '#9542ff',
  },
  [env.ROLE_DONOR_BLUE]: {
    cardDarkColor: '#161d1f',
    cardLightColor: '#283438',
    chipColor: '#3a5760',
    textColor: '#22bef0',
  },
  [env.ROLE_DONOR_GREEN]: {
    cardDarkColor: '#1a211c',
    cardLightColor: '#2d3b32',
    chipColor: '#275c39',
    textColor: '#45e47b',
  },
  [env.ROLE_DONOR_PINK]: {
    cardDarkColor: '#261c23',
    cardLightColor: '#44303d',
    chipColor: '#682b52',
    textColor: '#ff4ac1',
  },
  [env.ROLE_DONOR_RED]: {
    cardDarkColor: '#241b1b',
    cardLightColor: '#412e2e',
    chipColor: '#662526',
    textColor: '#ff3c3e',
  },
  [env.ROLE_DONOR_ORANGE]: {
    cardDarkColor: '#241f1b',
    cardLightColor: '#41362e',
    chipColor: '#664225',
    textColor: '#ff913b',
  },
  [env.ROLE_DONOR_YELLOW]: {
    cardDarkColor: '#23211a',
    cardLightColor: '#3f3b2c',
    chipColor: '#655721',
    textColor: '#ffd431',
  },
} as {
  [key: string]: {
    cardDarkColor: string;
    cardLightColor: string;
    chipColor: string;
    textColor: string;
  };
};
