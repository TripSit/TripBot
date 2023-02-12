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
import { levels } from '../../../global/commands/g.levels';
import { getRanks } from '../../../global/commands/g.leaderboard';
import { profile } from '../../../global/commands/g.profile';
import { getPersonaInfo } from '../../../global/commands/g.rpg';
import { inventoryGet } from '../../../global/utils/knex';
import { imageGet } from '../../utils/imageGet';
import { startLog } from '../../utils/startLog';
import { numFormatter } from './d.profile';
// import { expForNextLevel, getTotalLevel } from '../../../global/utils/experience';
// import { inventoryGet } from '../../../global/utils/knex';
// import { imageGet } from '../../utils/imageGet';

// import { getTotalLevel } from '../../../global/utils/experience';

export default dLevels;

const F = f(__filename);

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
      .setDescription('User to lookup')),
  async execute(
    interaction:ChatInputCommandInteraction | UserContextMenuCommandInteraction,
  ) {
    const startTime = Date.now();
    if (!interaction.guild) {
      interaction.reply('You can only use this command in a guild!');
      return false;
    }
    startLog(F, interaction);
    await interaction.deferReply();

    // Target is the option given, if none is given, it will be the user who used the command
    const target = interaction.options.getMember('target')
      ? interaction.options.getMember('target') as GuildMember
      : interaction.member as GuildMember;
    // log.debug(F, `target id: ${target.id}`);
    // log.debug(F, `targetData: ${JSON.stringify(target, null, 2)}`);

    const targetData = await levels(target.id);
    // log.debug(F, `targetData: ${JSON.stringify(targetData, null, 2)}`);

    const rankData = await getRanks(target.id);
    log.debug(F, `rankData: ${JSON.stringify(rankData, null, 2)}`);

    const profileData = await profile(target.id);
    // log.debug(F, `profileData: ${JSON.stringify(profileData, null, 2)}`);

    let layoutHeight = 386;
    let layout = 1;
    if (target.roles.cache.has(env.ROLE_TEAMTRIPSIT)) {
      layoutHeight = 566;
      layout = 4;
      log.debug(F, 'is teamtripsit');
    } else if (target.roles.cache.has(env.ROLE_CONTRIBUTOR)) {
      layoutHeight = 506;
      layout = 3;
      log.debug(F, 'is contributor');
    } else if (target.roles.cache.has(env.ROLE_HELPER)) {
      layoutHeight = 446;
      layout = 2;
      log.debug(F, 'is helper');
    }

    // Create Canvas and Context
    const canvasWidth = 921;
    const canvasHeight = layoutHeight;
    const canvasObj = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvasObj.getContext('2d');
    log.debug(F, `canvasHeight: ${canvasHeight}`);

    // Choose color based on user's role
    const cardLightColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardLightColor || '#141414';
    const cardDarkColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardDarkColor || '#101010';
    const chipColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.chipColor || '#202225';
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
    const [personaData] = await getPersonaInfo(target.id);
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
        context.roundRect(0, 0, 921, 145, [19]);
        context.roundRect(0, 154, 921, (layoutHeight - 154), [19]);
        context.clip();
        context.drawImage(Background, 0, 0);
        context.restore();
      }
    }

    // Avatar Image
    const avatar = await Canvas.loadImage(target.user.displayAvatarURL({ extension: 'jpg' }));
    context.save();
    context.beginPath();
    context.arc(73, 73, 54, 0, Math.PI * 2, true);
    context.closePath();
    context.clip();
    context.drawImage(avatar, 18, 18, 109, 109);
    context.restore();

    // Status Icon
    context.save();
    context.beginPath();
    context.arc(110, 112, 21, 0, Math.PI * 2, true);
    context.closePath();
    context.fillStyle = cardDarkColor;
    context.fill();
    context.restore();

    // const StatusIconPath = target.presence
    //   ? path.join(__dirname, '..', '..', 'assets', 'img', 'icons', `${target.presence?.status}.png`)
    //   : path.join(__dirname, '..', '..', 'assets', 'img', 'icons', 'offline.png');

    let StatusIconPath = await imageGet('iconOffline');
    if (target.presence) {
      if (target.presence.status === 'online') {
        StatusIconPath = await imageGet('iconOnline');
      } else if (target.presence.status === 'idle') {
        StatusIconPath = await imageGet('iconIdle');
      } else if (target.presence.status === 'dnd') {
        StatusIconPath = await imageGet('iconDnd');
      }
    }
    // log.debug(F, `StatusIconPath: ${StatusIconPath}`);
    const StatusIcon = await Canvas.loadImage(StatusIconPath);
    context.drawImage(StatusIcon, 90, 92);

    /* WIP: Camp Icon
    // const CampIcon = await Canvas.loadImage(await imageGet('campIconA'));
    context.drawImage(CampIcon, 556, 17);
    */

    // WIP: Check to see if a user has bought a title in the shop
    // If so, move Username Text up so the title can fit underneath

    // Username Text Resize to fit
    const applyUsername = (canvas:Canvas.Canvas, text:string) => {
      const usernameContext = canvas.getContext('2d');
      let fontSize = 40;
      do {
        fontSize -= 2;
        usernameContext.font = `${fontSize}px futura`;
      } while (usernameContext.measureText(text).width > 380);
      return usernameContext.font;
    };

    // Username Text
    context.font = applyUsername(canvasObj, `${target.displayName}`);
    context.fillStyle = textColor;
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.fillText(`${target.displayName}`, 146, 76);

    // Progress Bars Calculate
    const progressText = targetData.TEXT.TOTAL.level_exp / targetData.TEXT.TOTAL.nextLevel;
    const progressVoice = targetData.VOICE.TOTAL.level_exp / targetData.VOICE.TOTAL.nextLevel;

    const progressGeneral = targetData.TEXT.GENERAL
      ? targetData.TEXT.GENERAL.level_exp / targetData.TEXT.GENERAL.nextLevel
      : 0;
    const progressTripsitter = targetData.TEXT.TRIPSITTER
      ? targetData.TEXT.TRIPSITTER.level_exp / targetData.TEXT.TRIPSITTER.nextLevel
      : 0;
    const progressDeveloper = targetData.TEXT.DEVELOPER
      ? targetData.TEXT.DEVELOPER.level_exp / targetData.TEXT.DEVELOPER.nextLevel
      : 0;
    const progressTeam = targetData.TEXT.TEAM
      ? targetData.TEXT.TEAM.level_exp / targetData.TEXT.TEAM.nextLevel
      : 0;
    // Progress Bars Draw
    context.fillStyle = textColor;
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
    // Progress Bars Level Text
    context.font = '40px futura';
    context.fillStyle = '#ffffff';
    context.textBaseline = 'middle';
    context.textAlign = 'right';
    context.fillText(`${targetData.TEXT.TOTAL.level}`, 657, 213);
    context.font = '25px futura';
    context.fillText(`${targetData.TEXT.GENERAL.level}`, 657, 284);
    context.fillText(`${targetData.VOICE.TOTAL.level}`, 657, 344);
    if (layout > 1 && targetData.TEXT.TRIPSITTER) {
      context.fillText(`${targetData.TEXT.TRIPSITTER.level}`, 657, 404);
    } else {
      context.fillText('0', 657, 404);
    }
    if (layout > 2 && targetData.TEXT.DEVELOPER) {
      context.fillText(`${targetData.TEXT.DEVELOPER.level}`, 657, 464);
    } else {
      context.fillText('0', 657, 464);
    }
    if (layout > 3 && targetData.TEXT.TEAM) {
      context.fillText(`${targetData.TEXT.TEAM.level}`, 657, 524);
    } else {
      context.fillText('0', 657, 524);
    }
    // Rank Text
    context.font = '40px futura';
    context.textAlign = 'left';
    context.fillText(`#${rankData.TEXT.TOTAL}`, 711, 213);
    context.font = '25px futura';
    context.fillText(`#${rankData.TEXT.GENERAL}`, 711, 284);
    context.fillText(`#${rankData.VOICE.TOTAL}`, 711, 344);
    if (layout > 1) {
      context.fillText(`#${rankData.TEXT.TRIPSITTER}`, 711, 404);
    }
    if (layout > 2) {
      context.fillText(`#${rankData.TEXT.DEVELOPER}`, 711, 464);
    }
    if (layout > 3) {
      context.fillText(`#${rankData.TEXT.TEAM}`, 711, 524);
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
      context.fillText(`${numFormatter(hoursInChat)} HR`, 894, 105);
    } else {
      context.fillText('0 HR', 894, 105);
    }

    // Icon Images
    // Set a clip to prevent icons from being drawn outside of the card
    context.save();
    context.beginPath();
    context.roundRect(0, 0, 921, (layoutHeight - 18), [19]);
    context.clip();
    // Load Icon Images
    const Icons = await Canvas.loadImage(await imageGet('cardLevelIcons'));
    context.drawImage(Icons, 0, 0);
    context.restore();
    // Choose and Draw the Level Image
    let LevelImagePath = '' as string;

    if (targetData.TEXT.TOTAL.level < 10) {
      LevelImagePath = await imageGet('badgeVip0');
    } else if (targetData.TEXT.TOTAL.level < 20) {
      LevelImagePath = await imageGet('badgeVip1');
    } else if (targetData.TEXT.TOTAL.level < 30) {
      LevelImagePath = await imageGet('badgeVip2');
    } else if (targetData.TEXT.TOTAL.level < 40) {
      LevelImagePath = await imageGet('badgeVip3');
    } else if (targetData.TEXT.TOTAL.level < 50) {
      LevelImagePath = await imageGet('badgeVip4');
    } else if (targetData.TEXT.TOTAL.level < 60) {
      LevelImagePath = await imageGet('badgeVip5');
    } else if (targetData.TEXT.TOTAL.level < 70) {
      LevelImagePath = await imageGet('badgeVip6');
    } else if (targetData.TEXT.TOTAL.level < 80) {
      LevelImagePath = await imageGet('badgeVip7');
    } else if (targetData.TEXT.TOTAL.level < 90) {
      LevelImagePath = await imageGet('badgeVip8');
    } else if (targetData.TEXT.TOTAL.level < 100) {
      LevelImagePath = await imageGet('badgeVip9');
    } else if (targetData.TEXT.TOTAL.level >= 100) {
      LevelImagePath = await imageGet('badgeVip10');
    }
    const LevelImage = await Canvas.loadImage(LevelImagePath);
    context.drawImage(LevelImage, 97, 181, 58, 58);

    // Process The Entire Card and Send it to Discord
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), { name: 'tripsit-levels-image.png' });
    interaction.editReply({ files: [attachment] });

    log.debug(F, `Total Time: ${Date.now() - startTime}ms`);
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
