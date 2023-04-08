import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  // UserContextMenuCommandInteraction,
  GuildMember,
  AttachmentBuilder,
} from 'discord.js';
import Canvas from '@napi-rs/canvas';
import * as path from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { levels } from '../../../global/commands/g.levels';
import { profile, ProfileData } from '../../../global/commands/g.profile';
import { getPersonaInfo } from '../../../global/commands/g.rpg';
import { inventoryGet } from '../../../global/utils/knex';
import { imageGet } from '../../utils/imageGet';
import { commandContext } from '../../utils/context';
import { numFormatter, numFormatterVoice } from './d.profile';
import { Personas } from '../../../global/@types/database';
// import { expForNextLevel, getTotalLevel } from '../../../global/utils/experience';
// import { inventoryGet } from '../../../global/utils/knex';
// import { imageGet } from '../../utils/imageGet';

// import { getTotalLevel } from '../../../global/utils/experience';

const F = f(__filename);

type LevelData = {
  TEXT: {
    TOTAL: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
      rank: number,
    },
    [key: string]: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
      rank: number,
    },
  },
  VOICE: {
    TOTAL: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
      rank: number,
    },
    [key: string]: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
      rank: number,
    },
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
  [env.ROLE_BLACK]: {
    cardDarkColor: '#0e0e0e',
    cardLightColor: '#181818',
    chipColor: '#262626',
    barColor: '#595959',
    textColor: '#626262',
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

Canvas.GlobalFonts.registerFromPath(
  path.resolve(__dirname, '../../assets/Futura.otf'),
  'futura',
);

export const dLevels: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('levels')
    .setDescription('Get someone\'s current experience levels!')
    .addUserOption(option => option
      .setName('target')
      .setDescription('User to lookup'))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(
    interaction:ChatInputCommandInteraction,
  ) {
    log.info(F, await commandContext(interaction));
    const startTime = Date.now();
    if (!interaction.guild) {
      await interaction.editReply('You can only use this command in a guild!');
      return false;
    }

    // Target is the option given, if none is given, it will be the user who used the command
    const target = interaction.options.getMember('target')
      ? interaction.options.getMember('target') as GuildMember
      : interaction.member as GuildMember;
    // log.debug(F, `target id: ${target.id}`);
    // log.debug(F, `levelData: ${JSON.stringify(target, null, 2)}`);
    const values = await Promise.allSettled([
      await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) }),
      // Get the target's profile data from the database
      await profile(target.id),
      // Check get fresh persona data
      await getPersonaInfo(target.id),
      // Get the levels of the user
      await levels(target.id),
      // Load Icon Images
      await Canvas.loadImage(await imageGet('cardLevelIcons')),
      // Get the status icon
      // await Canvas.loadImage(await imageGet(`icon_${target.presence?.status ?? 'offline'}`)),
      // Get the avatar image
      await Canvas.loadImage(target.user.displayAvatarURL({ extension: 'jpg' })),
    ]);

    const profileData = values[1].status === 'fulfilled' ? values[1].value : {} as ProfileData;
    const personaData = values[2].status === 'fulfilled' ? values[2].value : {} as Personas;
    const levelData = values[3].status === 'fulfilled' ? values[3].value : {} as LevelData;
    const Icons = values[4].status === 'fulfilled' ? values[4].value : {} as Canvas.Image;
    // const StatusIcon = values[5].status === 'fulfilled' ? values[5].value : {} as Canvas.Image;
    const avatar = values[5].status === 'fulfilled' ? values[5].value : {} as Canvas.Image;

    // log.debug(F, `levelData: ${JSON.stringify(levelData, null, 2)}`);

    // For debugging
    // const layoutHeight = 566;
    // const layout = 4;
    let layoutHeight = 386;
    let layout = 1;
    if (target.roles.cache.has(env.ROLE_TEAMTRIPSIT)) {
      layoutHeight = 566;
      layout = 4;
      // log.debug(F, 'is teamtripsit');
    } else if (target.roles.cache.has(env.ROLE_CONTRIBUTOR) || target.roles.cache.has(env.ROLE_DEVELOPER)) {
      layoutHeight = 506;
      layout = 3;
      // log.debug(F, 'is contributor');
    } else if (target.roles.cache.has(env.ROLE_HELPER) || target.roles.cache.has(env.ROLE_TRIPSITTER)) {
      layoutHeight = 446;
      layout = 2;
      // log.debug(F, 'is helper');
    }

    // Create Canvas and Context
    const canvasWidth = 921;
    const canvasHeight = layoutHeight;
    const canvasObj = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvasObj.getContext('2d');
    // log.debug(F, `canvasHeight: ${canvasHeight}`);

    // Choose color based on user's role
    const cardLightColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardLightColor || '#232323';
    const cardDarkColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardDarkColor || '#141414';
    const chipColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.chipColor || '#393939';
    const barColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.barColor || '#b3b3b3';
    const textColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.textColor || '#ffffff';

    // Draw the card shape and chips
    // Card
    context.fillStyle = cardLightColor;
    context.beginPath();
    context.roundRect(20, 0, 901, 145, [19]);
    context.roundRect(20, 154, 901, (layoutHeight - 154), [19]);
    context.fill();
    context.fillStyle = cardDarkColor;
    context.beginPath();
    context.roundRect(0, 0, 684, 145, [19]);
    context.roundRect(0, 154, 684, (layoutHeight - 154), [19]);
    context.fill();
    // Top Right Chips
    context.fillStyle = chipColor;
    context.beginPath();
    // context.arc(612, 73, 54, 0, Math.PI * 2, true); // CAMP ICON CHIP
    context.roundRect(702, 18, 201, 51, [19]);
    context.roundRect(702, 78, 201, 51, [19]);
    // Label Chips
    context.roundRect(18, 172, 51, (layoutHeight - 190), [19]);
    context.roundRect(852, 172, 51, (layoutHeight - 190), [19]);
    // Level Bar and Rank Chips
    context.roundRect(87, 172, 579, 76, [19]);
    context.roundRect(702, 172, 132, 76, [19]);
    context.roundRect(87, 257, 579, 51, [19]);
    context.roundRect(702, 257, 132, 51, [19]);
    context.roundRect(87, 317, 579, 51, [19]);
    context.roundRect(702, 317, 132, 51, [19]);
    if (layout > 1) {
      context.roundRect(87, 377, 579, 51, [19]);
      context.roundRect(702, 377, 132, 51, [19]);
    }
    if (layout > 2) {
      context.roundRect(87, 437, 579, 51, [19]);
      context.roundRect(702, 437, 132, 51, [19]);
    }
    if (layout > 3) {
      context.roundRect(87, 497, 579, 51, [19]);
      context.roundRect(702, 497, 132, 51, [19]);
    }
    context.fill();

    // Purchased Background
    // Check get fresh persona data
    // log.debug(F, `personaData home (Change) ${JSON.stringify(personaData, null, 2)}`);

    if (personaData) {
      // Get the existing inventory data
      const inventoryData = await inventoryGet(personaData.id);
      // log.debug(F, `Persona home inventory (change): ${JSON.stringify(inventoryData, null, 2)}`);

      const equippedBackground = inventoryData.find(item => item.equipped === true && item.effect === 'background');
      // log.debug(F, `equippedBackground: ${JSON.stringify(equippedBackground, null, 2)} `);
      if (equippedBackground) {
        const imagePath = await imageGet(equippedBackground.value);
        const Background = await Canvas.loadImage(imagePath);
        context.save();
        context.globalCompositeOperation = 'lighter';
        context.globalAlpha = 0.03;
        context.beginPath();
        context.roundRect(0, 0, 921, 145, [19]);
        context.roundRect(0, 154, 921, (layoutHeight - 154), [19]);
        context.clip();
        context.drawImage(Background, 0, 0);
        context.restore();
      }
    }
    // Overly complicated avatar clip (STATUS CLIP COMMENTED OUT)
    context.save();
    // context.beginPath();
    // context.arc(110, 112, 21, 0, Math.PI * 2);
    // context.arc(73, 73, 55, 0, Math.PI * 2, true);
    // context.closePath();
    // context.clip();
    context.beginPath();
    context.arc(73, 73, 54, 0, Math.PI * 2, true);
    // context.closePath();
    context.clip();

    context.drawImage(avatar, 18, 18, 109, 109);
    context.restore();
    // context.drawImage(StatusIcon, 90, 92);

    // context.drawImage(CampIcon, 556, 17);

    // WIP: Check to see if a user has bought a title in the shop
    // If so, move Username Text up so the title can fit underneath

    // Username Text Resize to fit
    const applyUsername = (canvas:Canvas.Canvas, text:string) => {
      const usernameContext = canvas.getContext('2d');
      let fontSize = 40;
      do {
        fontSize -= 2;
        usernameContext.font = `${fontSize}px futura`;
      } while (usernameContext.measureText(text).width > 530);// LARGER LENGTH WHILE CAMP ISN'T ENABLED (DEFAULT IS 380)
      return usernameContext.font;
    };

    // Username Text
    context.font = applyUsername(canvasObj, `${target.displayName}`);
    context.fillStyle = textColor;
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.fillText(`${target.displayName}`, 146, 76);

    // Progress Bars Calculate
    const progressText = levelData.TEXT.TOTAL.level_exp / levelData.TEXT.TOTAL.nextLevel;
    const progressVoice = levelData.VOICE.TOTAL
      ? levelData.VOICE.TOTAL.level_exp / levelData.VOICE.TOTAL.nextLevel
      : 0;

    const progressGeneral = levelData.TEXT.GENERAL
      ? levelData.TEXT.GENERAL.level_exp / levelData.TEXT.GENERAL.nextLevel
      : 0;
    const progressTripsitter = levelData.TEXT.TRIPSITTER
      ? levelData.TEXT.TRIPSITTER.level_exp / levelData.TEXT.TRIPSITTER.nextLevel
      : 0;
    const progressDeveloper = levelData.TEXT.DEVELOPER
      ? levelData.TEXT.DEVELOPER.level_exp / levelData.TEXT.DEVELOPER.nextLevel
      : 0;
    const progressTeam = levelData.TEXT.TEAM
      ? levelData.TEXT.TEAM.level_exp / levelData.TEXT.TEAM.nextLevel
      : 0;
    // Progress Bars Draw
    context.fillStyle = barColor;
    context.save();
    context.beginPath();
    context.roundRect(87, 172, 579, 76, [19]);
    context.roundRect(87, 257, 579, 51, [19]);
    context.roundRect(87, 317, 579, 51, [19]);
    context.roundRect(87, 377, 579, 51, [19]);
    context.roundRect(87, 437, 579, 51, [19]);
    context.roundRect(87, 497, 579, 51, [19]);
    context.clip();
    context.beginPath();
    context.roundRect(87, 172, (progressText) * 579, 76, [19]);
    context.roundRect(87, 257, (progressGeneral) * 579, 51, [19]);
    context.roundRect(87, 317, (progressVoice) * 579, 51, [19]);
    if (layout > 1) {
      context.roundRect(87, 377, (progressTripsitter) * 579, 51, [19]);
    }
    if (layout > 2) {
      context.roundRect(87, 437, (progressDeveloper) * 579, 51, [19]);
    }
    if (layout > 3) {
      context.roundRect(87, 497, (progressTeam) * 579, 51, [19]);
    }
    context.fill();
    context.restore();
    // Progress Bars Level Text
    context.font = '40px futura';
    context.fillStyle = '#ffffff';
    context.textBaseline = 'middle';
    context.textAlign = 'right';
    context.fillText(`${levelData.TEXT.TOTAL.level}`, 657, 213);
    context.font = '25px futura';
    context.fillText(`${levelData.TEXT.GENERAL ? levelData.TEXT.GENERAL.level : 0}`, 657, 284);
    context.fillText(`${levelData.VOICE.TOTAL ? levelData.VOICE.TOTAL.level : 0}`, 657, 344);
    if (layout > 1 && levelData.TEXT.TRIPSITTER) {
      context.fillText(`${levelData.TEXT.TRIPSITTER.level}`, 657, 404);
    } else {
      context.fillText('0', 657, 404);
    }
    if (layout > 2 && levelData.TEXT.DEVELOPER) {
      context.fillText(`${levelData.TEXT.DEVELOPER.level}`, 657, 464);
    } else {
      context.fillText('0', 657, 464);
    }
    if (layout > 3 && levelData.TEXT.TEAM) {
      context.fillText(`${levelData.TEXT.TEAM.level}`, 657, 524);
    } else {
      context.fillText('0', 657, 524);
    }
    // Rank Text
    // Rank Text Resize to fit
    let startingFontSize = 40;
    const applyRank = (canvas:Canvas.Canvas, text:string) => {
      const rankContext = canvas.getContext('2d');
      let fontSize = startingFontSize;
      do {
        fontSize -= 1;
        rankContext.font = `${fontSize}px futura`;
      } while (rankContext.measureText(text).width > 114);// LARGER LENGTH WHILE CAMP ISN'T ENABLED (DEFAULT IS 380)
      return rankContext.font;
    };
    context.font = '40px futura';
    context.textAlign = 'left';
    context.font = applyRank(canvasObj, `#${levelData.TEXT.TOTAL.rank}`);
    context.fillText(`#${levelData.TEXT.TOTAL.rank}`, 711, 213);
    context.font = '25px futura';
    startingFontSize = 25;
    if (levelData.TEXT.GENERAL) {
      context.font = applyRank(canvasObj, `#${levelData.TEXT.GENERAL.rank}`);
      context.fillText(`#${levelData.TEXT.GENERAL.rank}`, 711, 284);
    } else {
      context.font = applyRank(canvasObj, '#0');
      context.fillText('#0', 711, 284);
    }
    if (levelData.VOICE.TOTAL) {
      context.font = applyRank(canvasObj, `#${levelData.VOICE.TOTAL.rank}`);
      context.fillText(`#${levelData.VOICE.TOTAL.rank}`, 711, 344);
    } else {
      context.font = applyRank(canvasObj, '#0');
      context.fillText('#0', 711, 344);
    }
    if (layout > 1 && levelData.TEXT.TRIPSITTER) {
      context.font = applyRank(canvasObj, `#${levelData.TEXT.TRIPSITTER.rank}`);
      context.fillText(`#${levelData.TEXT.TRIPSITTER.rank}`, 711, 404);
    } else {
      context.font = applyRank(canvasObj, '#0');
      context.fillText('#0', 711, 404);
    }
    if (layout > 2 && levelData.TEXT.DEVELOPER) {
      context.font = applyRank(canvasObj, `#${levelData.TEXT.DEVELOPER.rank}`);
      context.fillText(`#${levelData.TEXT.DEVELOPER.rank}`, 711, 464);
    } else {
      context.font = applyRank(canvasObj, '#0');
      context.fillText('#0', 711, 464);
    }
    if (layout > 3 && levelData.TEXT.TEAM) {
      context.font = applyRank(canvasObj, `#${levelData.TEXT.TEAM.rank}`);
      context.fillText(`#${levelData.TEXT.TEAM.rank}`, 711, 524);
    } else {
      context.font = applyRank(canvasObj, '#0');
      context.fillText('#0', 711, 524);
    }

    // Bar Labels
    context.textAlign = 'center';
    context.save();
    context.translate(921, 0);
    context.rotate((90 * Math.PI) / 180);
    context.fillText('RANK', ((layoutHeight / 2) + 77), 45);
    context.translate(layoutHeight, 921);
    context.rotate((180 * Math.PI) / 180);
    context.fillText('LEVEL', ((layoutHeight / 2) - 77), 45);
    context.restore();

    // Messages Sent Text
    context.textAlign = 'right';
    if (profileData.totalTextExp) {
      const MessagesSent = profileData.totalTextExp / 20;
      context.fillText(`${numFormatter(MessagesSent)}`, 894, 45);
    } else {
      context.fillText('0', 894, 45);
    }

    // Voice Hours Text
    if (profileData.totalTextExp) {
      const hoursInChat = (profileData.totalVoiceExp / 10 / 60);
      context.fillText(`${numFormatterVoice(hoursInChat)} HR`, 894, 105);
    } else {
      context.fillText('0 HR', 894, 105);
    }

    // Icon Images
    // Set a clip to prevent icons from being drawn outside of the card
    context.save();
    context.beginPath();
    context.roundRect(0, 0, 921, (layoutHeight - 18), [19]);
    context.clip();
    context.drawImage(Icons, 0, 0);
    context.restore();
    // Choose and Draw the Level Image
    let LevelImagePath = '' as string;
    if (levelData.TEXT.TOTAL.level < 10) {
      LevelImagePath = 'badgeVip0';
    } else if (levelData.TEXT.TOTAL.level < 20) {
      LevelImagePath = 'badgeVip1';
    } else if (levelData.TEXT.TOTAL.level < 30) {
      LevelImagePath = 'badgeVip2';
    } else if (levelData.TEXT.TOTAL.level < 40) {
      LevelImagePath = 'badgeVip3';
    } else if (levelData.TEXT.TOTAL.level < 50) {
      LevelImagePath = 'badgeVip4';
    } else if (levelData.TEXT.TOTAL.level < 60) {
      LevelImagePath = 'badgeVip5';
    } else if (levelData.TEXT.TOTAL.level < 70) {
      LevelImagePath = 'badgeVip6';
    } else if (levelData.TEXT.TOTAL.level < 80) {
      LevelImagePath = 'badgeVip7';
    } else if (levelData.TEXT.TOTAL.level < 90) {
      LevelImagePath = 'badgeVip8';
    } else if (levelData.TEXT.TOTAL.level < 100) {
      LevelImagePath = 'badgeVip9';
    } else if (levelData.TEXT.TOTAL.level >= 100) {
      LevelImagePath = 'badgeVip10';
    }
    const LevelImage = await Canvas.loadImage(await imageGet(LevelImagePath));
    context.drawImage(LevelImage, 97, 181, 58, 58);

    // Process The Entire Card and Send it to Discord
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), { name: 'tripsit-levels-image.png' });
    await interaction.editReply({ files: [attachment] });

    log.info(F, `Total Time: ${Date.now() - startTime}ms`);
    return true;
  },
};

export default dLevels;
