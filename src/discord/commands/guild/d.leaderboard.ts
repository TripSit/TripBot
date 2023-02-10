import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  UserContextMenuCommandInteraction,
  GuildMember,
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

const F = f(__filename);

Canvas.GlobalFonts.registerFromPath(
  path.resolve(__dirname, '../../assets/img/Futura.otf'),
  'futura',
);

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

export default dLeaderboard;

export const dLeaderboard: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the experience leaderboard')
    .addStringOption(option => option.setName('category')
      .setDescription('Which category? (Default: Total)')
      .addChoices(
        { name: 'Total', value: 'TOTAL' },
        { name: 'Chat', value: 'GENERAL' },
        { name: 'Voice', value: 'VOICE' },
        { name: 'Harm Reduction', value: 'TRIPSITTER' },
        { name: 'Development', value: 'DEVELOPER' },
        { name: 'Team Tripsit', value: 'TEAM' },
      )),
  async execute(interaction) {
    startLog(F, interaction);
    // Immediately defer to buy us time to do calculations and such, otherwise there's a 3 second window to respond
    await interaction.deferReply();
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

    // Get the category option from the slash command
    const categoryOption = interaction.options.getString('category');
    // If the category option is not null, convert it to lowercase, otherwise set it to 'total'
    const categoryChoice = categoryOption ? categoryOption.toLowerCase() : 'total';

    // Category Title Text
    context.font = '40px futura';
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.fillText(`TOP 10 - ${categoryOption}`, 460, 47);
    // Get the leaderboard data from the db, this looks like:
    // leaderboardData = {
    //   text: {
    //     total: [] as RankData[],
    //     tripsitter: [] as RankData[],
    //     general: [] as RankData[],
    //     developer: [] as RankData[],
    //     team: [] as RankData[],
    //     ignored: [] as RankData[],
    //   },
    //   voice: {
    //     total: [] as RankData[],
    //     tripsitter: [] as RankData[],
    //     general: [] as RankData[],
    //     developer: [] as RankData[],
    //     team: [] as RankData[],
    //     ignored: [] as RankData[],
    //   },
    // };
    //
    // Rank Data looks like:
    // RankData = {
    //   rank: number,
    //   discordId: string,
    //   level: number,
    //   exp: number,
    //   nextLevel: number,
    // };
    //
    // The data is sorted by most experience, so the first entry in the array is the highest rank
    // If there are no entries in the array, then there are no users in that category, but this wont happen in prod
    const leaderboardData = await getLeaderboard();

    // Get the guild object from the client, do this outside the loop to save memory
    const tripsitGuild = await interaction.client.guilds.fetch(env.DISCORD_GUILD_ID); // eslint-disable-line

    // Loop through the leaderboard data, first by the Type (text/voice)
    for (const [type, typeData] of Object.entries(leaderboardData)) { // eslint-disable-line
      log.debug(F, `Type: ${type}`);
      // Loop through the individual category's rank data
      for (const [category, rankDataList] of Object.entries(typeData)) { // eslint-disable-line
        log.debug(F, `Category: ${category}`);

        // If the user chose a category, and the category we're on doesn't match the category they chose, skip it
        if (categoryChoice !== 'overall' && categoryChoice !== category) continue; // eslint-disable-line

        // Initialize rank at 0 so we can increment it
        let rank = 1;
        let rankPositions = 1;
        // Loop through the rank data list
        for (const rankData of rankDataList) { // eslint-disable-line
          log.debug(F, `rankData: ${JSON.stringify(rankData, null, 2)}`);
          // RankData = {
          //   rank: number,
          //   discordId: string,
          //   level: number,
          //   exp: number,
          //   nextLevel: number,
          // };

          // Get the discord member object from the guild object
          const member = await tripsitGuild.members.fetch(rankData.discordId); // eslint-disable-line

          // Draw basically everything else
          context.textBaseline = 'middle';
          // Choose color based on user's role
          const cardLightColor = colorDefs[member.roles.color?.id as keyof typeof colorDefs]?.cardLightColor || '#141414';
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
          }
          context.fillStyle = cardLightColor;
          context.beginPath();
          context.roundRect(94, 0, 338, 76, [0, 19, 19, 0]);
          context.fill();

          // Purchased Background
          // Check get fresh persona data
          const [personaData] = await getPersonaInfo(member.id);
          // log.debug(F, `personaData home (Change) ${JSON.stringify(personaData, null, 2)}`);

          if (personaData) {
            // Get the existing inventory data
            const inventoryData = await inventoryGet(personaData.id);
            // log.debug(F, `Persona home inventory (change): ${JSON.stringify(inventoryData, null, 2)}`);

            const equippedBackground = inventoryData.find(item => item.equipped === true);
            log.debug(F, `equippedBackground: ${JSON.stringify(equippedBackground, null, 2)} `);
            if (equippedBackground) {
              const imagePath = await imageGet(equippedBackground.value);
              const Background = await Canvas.loadImage(imagePath);
              context.save();
              context.globalCompositeOperation = 'lighter';
              context.globalAlpha = 0.03;
              context.beginPath();
              context.roundRect(94, 0, 338, 76, [0, 19, 19, 0]);
              context.clip();
              context.drawImage(Background, 0, 0, 500, 500);
              context.restore();
            }
          }
          // Draw Rank Number
          context.fillStyle = '#ffffff';
          context.font = '30px futura';
          context.textAlign = 'left';
          context.textBaseline = 'middle';
          context.fillText(`#${rank}`, 0, 38);
          // Draw Profile Picture
          const avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'jpg' }));
          context.save();
          context.beginPath();
          context.arc(94, 38, 38, 0, Math.PI * 2, true);
          context.closePath();
          context.clip();
          context.drawImage(avatar, 56, 0, 76, 76);
          context.restore();
          // Draw Username
          const applyUsername = (canvas:Canvas.Canvas, text:string) => {
            const usernameContext = canvas.getContext('2d');
            let fontSize = 30;
            do {
              fontSize -= 2;
              usernameContext.font = `${fontSize}px futura`;
            } while (usernameContext.measureText(text).width > 250);
            return usernameContext.font;
          };
          context.save();
          context.font = applyUsername(canvasObj, `${member.displayName}`);
          context.fillStyle = textColor;
          context.textAlign = 'left';
          context.textBaseline = 'middle';
          context.fillText(`${member.displayName}`, 143, 38);
          context.restore();
          // Draw Level Number
          context.fillStyle = textColor;
          context.textAlign = 'right';
          context.fillText(`${rankData.level}`, 417, 38);
          context.restore();

          // Increment the rank
          rank += 1;
          rankPositions += 1;
        }
      }
    }

    // Process The Entire Card and Send it to Discord
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), { name: 'tripsit-levels-image.png' });
    interaction.editReply({ files: [attachment] });
    return true;
  },
};
