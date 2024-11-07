import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  // UserContextMenuCommandInteraction,
  GuildMember,
  AttachmentBuilder,
} from 'discord.js';
import Canvas from '@napi-rs/canvas';
import { personas } from '@prisma/client';
import { SlashCommand } from '../../@types/commandDef';
import { levels } from '../../../global/commands/g.levels';
import { profile, ProfileData } from '../../../global/commands/g.profile';
import { getPersonaInfo } from '../../../global/commands/g.rpg';
import getAsset from '../../utils/getAsset';
import commandContext from '../../utils/context';
import { numFormatter, numFormatterVoice } from './d.profile';

// import { getTotalLevel } from '../../../global/utils/experience';
import { resizeText, deFuckifyText, generateColors } from '../../utils/canvasUtils';
// import { expForNextLevel, getTotalLevel } from '../../../global/utils/experience';
// import { imageGet } from '../../utils/imageGet';

const F = f(__filename);

const fontSizeFamily = '25px futura';

type LevelData = {
  ALL: {
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
      // Load Images
      await Canvas.loadImage(await getAsset('cardLevelIcons')),
      await Canvas.loadImage(target.displayAvatarURL({ extension: 'jpg' })),
      await Canvas.loadImage(await getAsset('teamtripsitIcon')),
      await Canvas.loadImage(await getAsset('premiumIcon')),
      await Canvas.loadImage(await getAsset('boosterIcon')),
      await Canvas.loadImage(await getAsset('legacyIcon')),
      await Canvas.loadImage(await getAsset('voiceBar')),
      await Canvas.loadImage(await getAsset('tripsitterBar')),
      await Canvas.loadImage(await getAsset('developerBar')),
      await Canvas.loadImage(await getAsset('teamtripsitBar')),
    ]);

    const profileData = values[1].status === 'fulfilled' ? values[1].value : {} as ProfileData;
    const personaData = values[2].status === 'fulfilled' ? values[2].value : {} as personas;
    const levelData = values[3].status === 'fulfilled' ? values[3].value : {} as LevelData;
    const Icons = values[4].status === 'fulfilled' ? values[4].value : {} as Canvas.Image;
    // const StatusIcon = values[5].status === 'fulfilled' ? values[5].value : {} as Canvas.Image;
    const avatar = values[5].status === 'fulfilled' ? values[5].value : {} as Canvas.Image;
    const teamtripsitIcon = values[6].status === 'fulfilled' ? values[6].value : {} as Canvas.Image;
    const premiumIcon = values[7].status === 'fulfilled' ? values[7].value : {} as Canvas.Image;
    const boosterIcon = values[8].status === 'fulfilled' ? values[8].value : {} as Canvas.Image;
    const legacyIcon = values[9].status === 'fulfilled' ? values[9].value : {} as Canvas.Image;
    const voiceBar = values[10].status === 'fulfilled' ? values[10].value : {} as Canvas.Image;
    const tripsitterBar = values[11].status === 'fulfilled' ? values[11].value : {} as Canvas.Image;
    const developerBar = values[12].status === 'fulfilled' ? values[12].value : {} as Canvas.Image;
    const teamtripsitBar = values[13].status === 'fulfilled' ? values[13].value : {} as Canvas.Image;

    const avatarIconRoles = {
      [env.ROLE_TEAMTRIPSIT]: {
        image: teamtripsitIcon,
        hierarchy: 1,
      },
      [env.ROLE_PREMIUM]: {
        image: premiumIcon,
        hierarchy: 2,
      },
      [env.ROLE_BOOSTER]: {
        image: boosterIcon,
        hierarchy: 3,
      },
      [env.ROLE_LEGACY]: {
        image: legacyIcon,
        hierarchy: 4,
      },
    };

    let avatarIconSlot1 = {} as {
      image: Canvas.Image;
    };

    let avatarIconSlot2 = {} as {
      image: Canvas.Image;
    };

    let avatarIconSlot3 = {} as {
      image: Canvas.Image;
    };

    let avatarIconSlot4 = {} as {
      image: Canvas.Image;
    };

    // Check if user has any roles that have an avatar icon. Put all of them in an array and sort them by hierarchy
    const avatarIconRolesArray = Object.entries(avatarIconRoles)
      .filter(([key]) => target.roles.cache.has(key))
      .sort((a, b) => a[1].hierarchy - b[1].hierarchy);

    // From the list, assign each one to a slot in numerical order
    if (avatarIconRolesArray.length > 0) {
      avatarIconSlot1 = {
        image: avatarIconRolesArray[0][1].image,
      };
    }
    if (avatarIconRolesArray.length > 1) {
      avatarIconSlot2 = {
        image: avatarIconRolesArray[1][1].image,
      };
    }
    if (avatarIconRolesArray.length > 2) {
      avatarIconSlot3 = {
        image: avatarIconRolesArray[2][1].image,
      };
    }
    if (avatarIconRolesArray.length > 3) {
      avatarIconSlot4 = {
        image: avatarIconRolesArray[3][1].image,
      };
    }

    // Default Progress Bars Calculate
    // const progressText = levelData.TEXT.TOTAL.level_exp / levelData.TEXT.TOTAL.nextLevel;
    const progressTotal = levelData.ALL.TOTAL.level_exp / levelData.ALL.TOTAL.nextLevel;
    const progressGeneral = levelData.TEXT.GENERAL
      ? levelData.TEXT.GENERAL.level_exp / levelData.TEXT.GENERAL.nextLevel
      : 0;

    let xpBarSlot1 = {} as {
      image: Canvas.Image;
      dataName: string;
      progress: number;
      level: number;
      rank: number;
    };
    let xpBarSlot2 = {} as {
      image: Canvas.Image;
      dataName: string;
      progress: number;
      level: number;
      rank: number;
    };
    let xpBarSlot3 = {} as {
      image: Canvas.Image;
      dataName: string;
      progress: number;
      level: number;
      rank: number;
    };
    let xpBarSlot4 = {} as {
      image: Canvas.Image;
      dataName: string;
      progress: number;
      level: number;
      rank: number;
    };

    const xpBarList = [] as {
      image: Canvas.Image;
      dataName: string;
      progress: number;
      level: number;
      rank: number;
    }[];

    // Check if user has voice xp, if so add it to the list to be assigned a xp bar slot
    if (levelData.VOICE.TOTAL.level) {
      const progressVoice = levelData.VOICE.TOTAL.level_exp / levelData.VOICE.TOTAL.nextLevel;
      xpBarList.push({
        image: voiceBar,
        dataName: 'Voice',
        progress: progressVoice,
        level: levelData.VOICE.TOTAL.level,
        rank: levelData.VOICE.TOTAL.rank,
      });
    }
    // Check if user has Helper or Tripsitter role
    if (target.roles.cache.has(env.ROLE_HELPER) || target.roles.cache.has(env.ROLE_TRIPSITTER)) {
      const progressTripsitter = levelData.TEXT.TRIPSITTER
        ? levelData.TEXT.TRIPSITTER.level_exp / levelData.TEXT.TRIPSITTER.nextLevel
        : 0;
      xpBarList.push({
        image: tripsitterBar,
        dataName: 'Tripsitter',
        progress: progressTripsitter,
        level: levelData.TEXT.TRIPSITTER ? levelData.TEXT.TRIPSITTER.level : 0,
        rank: levelData.TEXT.TRIPSITTER ? levelData.TEXT.TRIPSITTER.rank : 0,
      });
    }
    // Check if user has Developer or Contributor role
    if (levelData.TEXT.DEVELOPER && levelData.TEXT.DEVELOPER.level > 5) {
      const progressDeveloper = levelData.TEXT.DEVELOPER
        ? levelData.TEXT.DEVELOPER.level_exp / levelData.TEXT.DEVELOPER.nextLevel
        : 0;
      xpBarList.push({
        image: developerBar,
        dataName: 'Developer',
        progress: progressDeveloper,
        level: levelData.TEXT.DEVELOPER ? levelData.TEXT.DEVELOPER.level : 0,
        rank: levelData.TEXT.DEVELOPER ? levelData.TEXT.DEVELOPER.rank : 0,
      });
    }
    // Check if user has Teamtripsit role
    if (target.roles.cache.has(env.ROLE_TEAMTRIPSIT)) {
      const progressTeam = levelData.TEXT.TEAM
        ? levelData.TEXT.TEAM.level_exp / levelData.TEXT.TEAM.nextLevel
        : 0;
      xpBarList.push({
        image: teamtripsitBar,
        dataName: 'Team',
        progress: progressTeam,
        level: levelData.TEXT.TEAM ? levelData.TEXT.TEAM.level : 0,
        rank: levelData.TEXT.TEAM ? levelData.TEXT.TEAM.rank : 0,
      });
    }

    // Assign the xp bars to slots and decide the canvas height based on how many bars there are
    // let layoutHeight = 386;
    let layout = 1;
    let layoutHeight = 326;

    if (xpBarList.length > 0) {
      // Assign the first one to slot 1
      [xpBarSlot1] = xpBarList;
      layoutHeight = 395;
      layout = 2;
    }
    if (xpBarList.length > 1) {
      // Assign the second one to slot 2
      [,xpBarSlot2] = xpBarList;
      layoutHeight = 446;
      layout = 3;
    }
    if (xpBarList.length > 2) {
      // Assign the third one to slot 3
      [,,xpBarSlot3] = xpBarList;
      layoutHeight = 506;
      layout = 4;
    }
    if (xpBarList.length > 3) {
      // Assign the fourth one to slot 4
      [,,,xpBarSlot4] = xpBarList;
      layoutHeight = 566;
      layout = 5;
    }

    // Create Canvas and Context
    const canvasWidth = 921;
    const canvasHeight = layoutHeight;
    const canvasObj = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvasObj.getContext('2d');
    // log.debug(F, `canvasHeight: ${canvasHeight}`);

    // Generate the colors for the card based on the user's role color
    const roleColor = `#${(target.roles.color?.color || 0x99aab5).toString(16).padStart(6, '0')}`;

    const cardLightColor = generateColors(roleColor, 0, -75, -67);
    const cardDarkColor = generateColors(roleColor, 0, -75, -80);
    const chipColor = generateColors(roleColor, 0, -50, -50);
    const barColor = generateColors(roleColor, 0, -20, -10);
    const textColor = generateColors(roleColor, 0, 0, 0);

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

    // Purchased Background
    // Check get fresh persona data
    // log.debug(F, `personaData home (Change) ${JSON.stringify(personaData, null, 2)}`);
    let userFont = 'futura';
    let userFlair = '';
    if (personaData) {
      // Get the existing inventory data
      const inventoryData = await db.rpg_inventory.findMany({
        where: {
          persona_id: personaData.id,
        },
      });
      // log.debug(F, `Persona home inventory (change): ${JSON.stringify(inventoryData, null, 2)}`);

      const equippedBackground = inventoryData.find(item => item.equipped === true && item.effect === 'background');
      const equippedFont = inventoryData.find(item => item.equipped === true && item.effect === 'font');
      const equippedFlair = inventoryData.find(item => item.equipped === true && item.effect === 'userflair');
      // log.debug(F, `equippedBackground: ${JSON.stringify(equippedBackground, null, 2)} `);
      if (equippedBackground) {
        const imagePath = await getAsset(equippedBackground.value);
        const Background = await Canvas.loadImage(imagePath);
        context.save();
        context.globalCompositeOperation = 'lighter';
        context.globalAlpha = 0.04;
        context.beginPath();
        context.roundRect(0, 0, 921, 145, [19]);
        context.roundRect(0, 154, 921, (layoutHeight - 154), [19]);
        context.clip();
        context.drawImage(Background, 0, 0);
        context.restore();
      }
      if (equippedFont) {
        await getAsset(equippedFont.value);
        userFont = equippedFont.value;
      }
      if (equippedFlair) {
        userFlair = equippedFlair.effect_value;
      }
    }
    // Top Right Chips
    context.fillStyle = chipColor;
    context.beginPath();
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
    if (layout >= 2) {
      context.roundRect(87, 317, 579, 51, [19]);
      context.roundRect(702, 317, 132, 51, [19]);
    }
    if (layout >= 3) {
      context.roundRect(87, 377, 579, 51, [19]);
      context.roundRect(702, 377, 132, 51, [19]);
    }
    if (layout >= 4) {
      context.roundRect(87, 437, 579, 51, [19]);
      context.roundRect(702, 437, 132, 51, [19]);
    }
    if (layout >= 5) {
      context.roundRect(87, 497, 579, 51, [19]);
      context.roundRect(702, 497, 132, 51, [19]);
    }
    context.fill();

    // Overly complicated avatar clip
    context.save();
    // If avatarIconSlot1 has an image, draw the hole for the icon
    if (avatarIconSlot1.image) {
      context.beginPath();
      context.arc(115, 117, 21, 0, Math.PI * 2);
      context.arc(73, 73, 55, 0, Math.PI * 2, true);
      context.closePath();
      context.clip();
    }
    // If avatarIconSlot2 has an image, draw the hole for the icon
    if (avatarIconSlot2.image) {
      context.beginPath();
      context.arc(31, 117, 21, 0, Math.PI * 2);
      context.arc(73, 73, 55, 0, Math.PI * 2, true);
      context.closePath();
      context.clip();
    }
    // If avatarIconSlot3 has an image, draw the hole for the icon
    if (avatarIconSlot3.image) {
      context.beginPath();
      context.arc(115, 28, 21, 0, Math.PI * 2);
      context.arc(73, 73, 55, 0, Math.PI * 2, true);
      context.closePath();
      context.clip();
    }
    // If avatarIconSlot4 has an image, draw the hole for the icon
    if (avatarIconSlot4.image) {
      context.beginPath();
      context.arc(31, 28, 21, 0, Math.PI * 2);
      context.arc(73, 73, 55, 0, Math.PI * 2, true);
      context.closePath();
      context.clip();
    }
    context.beginPath();
    context.arc(73, 73, 54, 0, Math.PI * 2, true);
    // context.closePath();
    context.clip();

    context.drawImage(avatar, 18, 18, 109, 109);
    context.restore();

    // Draw the avatar icons
    // If avatarIconSlot1 has an image, draw it
    if (avatarIconSlot1.image) {
      context.drawImage(avatarIconSlot1.image, 99, 102, 32, 32);
    }
    // If avatarIconSlot2 has an image, draw it
    if (avatarIconSlot2.image) {
      context.drawImage(avatarIconSlot2.image, 15, 102, 32, 32);
    }
    // If avatarIconSlot3 has an image, draw it
    if (avatarIconSlot3.image) {
      context.drawImage(avatarIconSlot3.image, 99, 12, 32, 32);
    }
    // If avatarIconSlot4 has an image, draw it
    if (avatarIconSlot4.image) {
      context.drawImage(avatarIconSlot4.image, 15, 12, 32, 32);
    }

    // WIP: Check to see if a user has bought a title in the shop
    // If so, move Username Text up so the title can fit underneath

    // Username Text
    let filteredDisplayName = await deFuckifyText(target.displayName);
    // If the filteredDisplayName is much shorter than what was input, display their username as a fallback
    if (filteredDisplayName.length < target.displayName.length / 2) {
      filteredDisplayName = target.user.username.charAt(0).toUpperCase() + target.user.username.slice(1);
    }

    context.fillStyle = textColor;
    context.font = `50px ${userFont}`;
    context.textAlign = 'left';
    let usernameHeight = 76;
    let fontSize = 50;
    const maxLength = 508;
    context.textBaseline = 'middle';

    if (userFlair) {
      usernameHeight = 78;
      fontSize = 30;
      context.textBaseline = 'top';
      context.font = resizeText(canvasObj, userFlair, fontSize, 'futura', maxLength);
      context.fillText(`${userFlair}`, 146, 100);
      context.textBaseline = 'bottom';
    }

    fontSize = 50;
    context.font = resizeText(canvasObj, filteredDisplayName, fontSize, userFont, maxLength);
    context.fillText(`${filteredDisplayName}`, 146, usernameHeight);
    context.textBaseline = 'middle';

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
    context.roundRect(87, 172, (progressTotal) * 579, 76, [19]);
    context.roundRect(87, 257, (progressGeneral) * 579, 51, [19]);
    if (xpBarSlot1.image) {
      context.roundRect(87, 317, (xpBarSlot1.progress) * 579, 51, [19]);
    }
    if (xpBarSlot2.image) {
      context.roundRect(87, 377, (xpBarSlot2.progress) * 579, 51, [19]);
    }
    if (xpBarSlot3.image) {
      context.roundRect(87, 437, (xpBarSlot3.progress) * 579, 51, [19]);
    }
    if (xpBarSlot4.image) {
      context.roundRect(87, 497, (xpBarSlot4.progress) * 579, 51, [19]);
    }
    context.fill();
    context.restore();

    // Level Text
    context.font = '40px futura';
    context.fillStyle = '#ffffff';
    context.textBaseline = 'middle';
    context.textAlign = 'right';
    context.fillText(`${levelData.ALL.TOTAL.level}`, 657, 213);
    context.font = fontSizeFamily;
    context.fillText(`${levelData.TEXT.GENERAL ? levelData.TEXT.GENERAL.level : 0}`, 657, 284);
    if (xpBarSlot1.image) {
      context.fillText(`${xpBarSlot1.level}`, 657, 344);
    }
    if (xpBarSlot2.image) {
      context.fillText(`${xpBarSlot2.level}`, 657, 404);
    }
    if (xpBarSlot3.image) {
      context.fillText(`${xpBarSlot3.level}`, 657, 464);
    }
    if (xpBarSlot4.image) {
      context.fillText(`${xpBarSlot4.level}`, 657, 524);
    }

    // Rank Text Resize to fit
    let startingFontSize = 40;
    const applyRank = (canvas:Canvas.Canvas, text:string) => {
      const rankContext = canvas.getContext('2d');
      fontSize = startingFontSize;
      do {
        fontSize -= 1;
        rankContext.font = `${fontSize}px futura`;
      } while (rankContext.measureText(text).width > 114);
      // Set the color of the rank text based on the rank
      if (text === '#1') {
        rankContext.fillStyle = '#d4af37';
      } else if (text === '#2') {
        rankContext.fillStyle = '#a8a9ad';
      } else if (text === '#3') {
        rankContext.fillStyle = '#aa7042';
      } else {
        rankContext.fillStyle = '#ffffff';
      }
      return rankContext.font;
    };

    // Rank Text
    context.textAlign = 'left';
    context.font = applyRank(canvasObj, `#${levelData.ALL.TOTAL.rank}`);
    context.fillText(`#${levelData.ALL.TOTAL.rank}`, 711, 213);

    startingFontSize = 25;
    context.font = applyRank(canvasObj, `#${levelData.TEXT.GENERAL ? levelData.TEXT.GENERAL.rank : 0}`);
    context.fillText(`#${levelData.TEXT.GENERAL ? levelData.TEXT.GENERAL.rank : 0}`, 711, 284);

    if (xpBarSlot1.image && xpBarSlot1.rank) {
      context.font = applyRank(canvasObj, `#${xpBarSlot1.rank}`);
      context.fillText(`#${xpBarSlot1.rank}`, 711, 344);
    } else if (xpBarSlot1.image && !xpBarSlot1.rank) {
      context.font = applyRank(canvasObj, '#0');
      context.fillText('#0', 711, 344);
    }
    if (xpBarSlot2.image && xpBarSlot2.rank) {
      context.font = applyRank(canvasObj, `#${xpBarSlot2.rank}`);
      context.fillText(`#${xpBarSlot2.rank}`, 711, 404);
    } else if (xpBarSlot2.image && !xpBarSlot2.rank) {
      context.font = applyRank(canvasObj, '#0');
      context.fillText('#0', 711, 404);
    }
    if (xpBarSlot3.image && xpBarSlot3.rank) {
      context.font = applyRank(canvasObj, `#${xpBarSlot3.rank}`);
      context.fillText(`#${xpBarSlot3.rank}`, 711, 464);
    } else if (xpBarSlot3.image && !xpBarSlot3.rank) {
      context.font = applyRank(canvasObj, '#0');
      context.fillText('#0', 711, 464);
    }
    if (xpBarSlot4.image && xpBarSlot4.rank) {
      context.font = applyRank(canvasObj, `#${xpBarSlot4.rank}`);
      context.fillText(`#${xpBarSlot4.rank}`, 711, 524);
    } else if (xpBarSlot4.image && !xpBarSlot4.rank) {
      context.font = applyRank(canvasObj, '#0');
      context.fillText('#0', 711, 524);
    }

    // Bar Labels
    context.textAlign = 'center';
    context.fillStyle = '#ffffff';
    context.font = fontSizeFamily;
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
    context.drawImage(Icons, 0, 0);
    if (xpBarSlot1.image) {
      context.drawImage(xpBarSlot1.image, 87, 317, 579, 51);
    }
    if (xpBarSlot2.image) {
      context.drawImage(xpBarSlot2.image, 87, 377, 579, 51);
    }
    if (xpBarSlot3.image) {
      context.drawImage(xpBarSlot3.image, 87, 437, 579, 51);
    }
    if (xpBarSlot4.image) {
      context.drawImage(xpBarSlot4.image, 87, 497, 579, 51);
    }

    // Choose and Draw the Level Image
    let LevelImagePath = '' as string;
    if (levelData.ALL.TOTAL.level <= 9) {
      LevelImagePath = 'badgeVip0';
    } else if (levelData.ALL.TOTAL.level <= 19) {
      LevelImagePath = 'badgeVip1';
    } else if (levelData.ALL.TOTAL.level <= 29) {
      LevelImagePath = 'badgeVip2';
    } else if (levelData.ALL.TOTAL.level <= 39) {
      LevelImagePath = 'badgeVip3';
    } else if (levelData.ALL.TOTAL.level <= 49) {
      LevelImagePath = 'badgeVip4';
    } else if (levelData.ALL.TOTAL.level <= 59) {
      LevelImagePath = 'badgeVip5';
    } else if (levelData.ALL.TOTAL.level <= 69) {
      LevelImagePath = 'badgeVip6';
    } else if (levelData.ALL.TOTAL.level <= 79) {
      LevelImagePath = 'badgeVip7';
    } else if (levelData.ALL.TOTAL.level <= 89) {
      LevelImagePath = 'badgeVip8';
    } else if (levelData.ALL.TOTAL.level <= 99) {
      LevelImagePath = 'badgeVip9';
    } else if (levelData.ALL.TOTAL.level >= 100) {
      LevelImagePath = 'badgeVip10';
    }
    const LevelImage = await Canvas.loadImage(await getAsset(LevelImagePath));
    context.drawImage(LevelImage, 97, 181, 58, 58);

    // Process The Entire Card and Send it to Discord
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), { name: `TS_Levels_${filteredDisplayName}_${formattedDate}.png` });
    await interaction.editReply({ files: [attachment] });

    log.info(F, `Total Time: ${Date.now() - startTime}ms`);
    return true;
  },
};

export default dLevels;
