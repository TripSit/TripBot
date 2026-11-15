/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  GuildMember,
  AttachmentBuilder,
  MessageFlags,
} from 'discord.js';
import Canvas from '@napi-rs/canvas';
import { SlashCommand } from '../../@types/commandDef';
import { profile } from '../../../global/commands/g.profile';
import commandContext from '../../utils/context';
import { expForNextLevel, getTotalLevel } from '../../../global/utils/experience';
import { getLevelFreeze } from '../../../global/commands/g.levelFreeze';
import { getPersonaInfo } from '../../../global/commands/g.rpg';
import getAsset from '../../utils/getAsset';
import { deFuckifyText, generateColors, resizeText } from '../../utils/canvasUtils';
import {
  Ctx, cardDisplayName, drawAvatar, drawPurchasedExtras, drawUsername, getAvatarIcons, levelBadgeName,
} from '../../utils/cardHelpers';

const F = f(__filename);

export function numFormatter(num:number):string {
  if (num > 999 && num < 1000000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  if (num > 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  return num.toFixed(0);
}

// Number Formatter Voice
export function numFormatterVoice(num:number):string {
  if (num > 999 && num < 1000000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  if (num > 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  return num.toFixed(1);
}

type ProfileData = Awaited<ReturnType<typeof profile>>;
type TotalLevel = Awaited<ReturnType<typeof getTotalLevel>>;

function drawProfileShape(context: Ctx, colors: { light: string; dark: string }): void {
  context.fillStyle = colors.light;
  context.beginPath();
  context.roundRect(0, 20, 675, 272, [19]);
  context.roundRect(684, 20, 237, 272, [19]);
  context.fill();
  context.fillStyle = colors.dark;
  context.beginPath();
  context.roundRect(0, 0, 675, 145, [19]);
  context.roundRect(684, 0, 237, 205, [19]);
  context.fill();
}

function drawProfileChips(context: Ctx, chipColor: string): void {
  context.fillStyle = chipColor;
  context.beginPath();
  context.roundRect(18, 163, 201, 51, [19]);
  context.roundRect(18, 223, 201, 51, [19]);
  context.roundRect(237, 163, 201, 51, [19]);
  context.roundRect(237, 223, 201, 51, [19]);
  context.roundRect(456, 163, 201, 51, [19]);
  context.roundRect(456, 223, 201, 51, [19]);
  context.roundRect(702, 223, 201, 51, [19]);
  context.fill();
}

function drawTimezone(context: Ctx, timezone: string | null): void {
  if (timezone) {
    const timestring = new Date().toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour12: true,
      hour: 'numeric',
      minute: 'numeric',
    });
    context.fillText(timestring, 210, 190);
  } else {
    context.fillText('NOT SET!', 210, 190);
  }
}

/** Draws the birthday and returns whether today is the birthday. */
function drawBirthday(context: Ctx, birthday: Date | null): boolean {
  if (!birthday) {
    context.fillText('NOT SET!', 210, 250);
    return false;
  }
  const today = new Date();
  const itIsYourBirthday = today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate();
  const day = birthday.getDate() < 10 ? `0${birthday.getDate()}` : `${birthday.getDate()}`;
  context.fillText(`${day} ${birthday.toLocaleString('en-GB', { month: 'short' }).toUpperCase()}`, 210, 250);
  return itIsYourBirthday;
}

function drawActivityStats(context: Ctx, profileData: ProfileData): void {
  // Messages Sent Text
  if (profileData.totalTextExp) {
    const MessagesSent = profileData.totalTextExp / 20;
    context.fillText(`${numFormatter(MessagesSent)}`, 429, 190);
  } else {
    context.fillText('0', 429, 190);
  }

  // Voice Hours Text
  if (profileData.totalTextExp) {
    const hoursInChat = (profileData.totalVoiceExp / 10 / 60);
    context.fillText(`${numFormatterVoice(hoursInChat)} HR`, 429, 250);
  } else {
    context.fillText('0 HR', 429, 250);
  }

  // Karma Text
  context.fillText(`${numFormatter(profileData.karma_received)}`, 648, 190);

  // Tokens Text
  context.fillText(`${numFormatter(profileData.tokens)}`, 648, 250);
}

async function drawLevelCircle(
  context: Ctx,
  totalTextData: TotalLevel,
  colors: { chipColor: string; barColor: string },
): Promise<void> {
  // Choose and Draw the Level Image
  const LevelImage = await Canvas.loadImage(await getAsset(levelBadgeName(totalTextData.level)));
  context.drawImage(LevelImage, 758, 59, 88, 88);

  // Level Bar Circle BG
  context.strokeStyle = colors.chipColor;
  context.lineWidth = 18;
  context.beginPath();
  context.arc(802, 103, 76, 0, 2 * Math.PI);
  context.stroke();

  // Level Bar Math
  const expToLevel = await expForNextLevel(totalTextData.level);
  const percentageOfLevel = (totalTextData.level_points / expToLevel);

  // Start at the 0 degrees position, in human terms, the 12 o'clock position
  const startDegrees = 0;
  // End degrees is the percentage of the level * 360 degrees, or a full circle
  const endDegrees = 360 * percentageOfLevel;

  // Canvas thinks that the "start" of a circle is the 3 o'clock position,
  // so we need to subtract 90 degrees from the start and end degrees to "rotate" the circle
  const startRadians = ((startDegrees - 90) * Math.PI) / 180;
  const endRadians = ((endDegrees - 90) * Math.PI) / 180;

  // Circular Level Bar
  context.strokeStyle = colors.barColor;
  context.lineCap = 'round';
  context.lineWidth = 18;
  context.beginPath();
  context.arc(802, 103, 76, startRadians, endRadians);
  context.stroke();
}

export const dProfile: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Get someone\'s profile!')
    .setIntegrationTypes([0])
    .addUserOption(option => option
      .setName('target')
      .setDescription('User to lookup'))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,
  async execute(
    interaction,
  ) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const startTime = Date.now();
    if (!interaction.guild) {
      await interaction.editReply({ content: 'You can only use this command in a guild!' });
      return false;
    }

    // Target is the option given, if none is given, it will be the user who used the command
    // First try to get as User (works even if not in guild)
    const targetUser = interaction.options.getUser('target') ?? interaction.user;

    // Then try to get as GuildMember (may be null if not in guild)
    let target: GuildMember | null = null;
    try {
      target = await interaction.guild.members.fetch(targetUser.id);
    } catch {
      // User is not in the guild, target will remain null
      log.debug(F, `User ${targetUser.id} is not in the guild`);
    }

    // If target is still null (user not in guild), we'll use fallback values below

    const values = [

      // Get the target's profile data from the database
      await profile(targetUser.id),
      // Check get fresh persona data
      await getPersonaInfo(targetUser.id),
      // Load Icon Images
      await Canvas.loadImage(await getAsset('cardIcons')),
      // Get the avatar image
      await Canvas.loadImage(targetUser.displayAvatarURL({ extension: 'jpg' })),
      // Get the birthday card overlay
      await Canvas.loadImage(await getAsset('cardBirthday')),
      await Canvas.loadImage(await getAsset('teamtripsitIcon')),
      await Canvas.loadImage(await getAsset('premiumIcon')),
      await Canvas.loadImage(await getAsset('boosterIcon')),
      await Canvas.loadImage(await getAsset('legacyIcon')),
    ] as const;

    const profileData = values[0];
    const personaData = values[1];
    const Icons = values[2];
    const avatar = values[3];
    const birthdayOverlay = values[4];

    const avatarIconRoles = {
      [env.ROLE_TEAMTRIPSIT]: {
        image: values[5],
        hierarchy: 1,
      },
      [env.ROLE_PREMIUM]: {
        image: values[6],
        hierarchy: 2,
      },
      [env.ROLE_BOOSTER]: {
        image: values[7],
        hierarchy: 3,
      },
      [env.ROLE_LEGACY]: {
        image: values[8],
        hierarchy: 4,
      },
    };

    // Check if user has any roles that have an avatar icon, sorted by hierarchy and assigned to slots in order
    const avatarIcons = getAvatarIcons(target, avatarIconRoles);

    // Create Canvas and Context
    const canvasWidth = 921;
    const canvasHeight = 292;
    const canvasObj = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvasObj.getContext('2d');

    // Generate the colors for the card based on the user's role color
    // If user is not in guild, use default gray color
    const roleColor = target
      ? `#${(target.roles.color?.colors.primaryColor ?? 0x99aab5).toString(16).padStart(6, '0')}`
      : '#99aab5';
    log.debug(F, `roleColor: ${roleColor}`);

    const chipColor = generateColors(roleColor, 0, -50, -50);
    const barColor = generateColors(roleColor, 0, -20, -10);
    const textColor = generateColors(roleColor, 0, 0, 0);

    drawProfileShape(context, {
      light: generateColors(roleColor, 0, -75, -67),
      dark: generateColors(roleColor, 0, -75, -80),
    });

    // WIP: Purchased Background
    const { userFont, userFlair } = await drawPurchasedExtras(context, personaData, [
      [0, 0, 675, 292],
      [684, 0, 237, 292],
    ]);

    drawProfileChips(context, chipColor);
    context.drawImage(Icons, 0, 0);
    drawAvatar(context, avatar, avatarIcons);

    // Username Text
    const filteredDisplayName = cardDisplayName(target, targetUser);
    drawUsername(context, canvasObj, filteredDisplayName, { textColor, userFont, userFlair });

    // User Timezone
    context.font = '25px futura';
    context.textAlign = 'right';
    context.fillStyle = '#ffffff';
    drawTimezone(context, profileData.timezone);

    // User Birthday
    const itIsYourBirthday = drawBirthday(context, profileData.birthday);

    drawActivityStats(context, profileData);

    // Level Text (respects a level freeze if one is set for this user)
    const frozenLevel = await getLevelFreeze(targetUser.id);
    const totalTextData = await getTotalLevel(profileData.totalTextExp + profileData.totalVoiceExp, frozenLevel);
    context.fillText(`${totalTextData.level}`, 894, 250);

    await drawLevelCircle(context, totalTextData, { chipColor, barColor });

    // Birthday Mode
    if (itIsYourBirthday) {
      context.font = '40px futura';
      context.textAlign = 'left';
      context.fillStyle = textColor;
      context.fillText('HAPPY BIRTHDAY!', 146, 34);
      context.drawImage(birthdayOverlay, 0, 0, 934, 282);
    }

    // Process The Entire Card and Send it to Discord
    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), { name: `TS_Profile_${filteredDisplayName}_${formattedDate}.png` });
    await interaction.editReply({ files: [attachment] });

    log.info(F, `Total Time: ${Date.now() - startTime}ms`);
    return true;
  },
};

export async function getProfilePreview(target: GuildMember, option: string, imagePath?: string, fontName?: string): Promise<Buffer> {
  const values = [

    // Get the target's profile data from the database
    // await profile(target.id),
    // Check get fresh persona data
    // await getPersonaInfo(target.user.id),
    // Load Icon Images

    await Canvas.loadImage(await getAsset('cardIcons')),
    // Get the status icon
    // await Canvas.loadImage(await imageGet(`icon_${target.presence?.status ?? 'offline'}`)),
    // Get the avatar image
    await Canvas.loadImage(target.user.displayAvatarURL({ extension: 'jpg' })),
    // Get the birthday card overlay
    // await Canvas.loadImage(await imageGet('cardBirthday')),
  ] as const;
  const Icons = values[0];
  const avatar = values[1];

  // Create Canvas and Context
  const canvasWidth = 921;
  const canvasHeight = 292;
  const canvasObj = Canvas.createCanvas(canvasWidth, canvasHeight);
  const context = canvasObj.getContext('2d');

  // Generate the colors for the card based on the user's role color
  const roleColor = `#${(target.roles.color?.colors.primaryColor ?? 0x99aab5).toString(16).padStart(6, '0')}`;

  const cardLightColor = generateColors(roleColor, 0, -75, -67);
  const cardDarkColor = generateColors(roleColor, 0, -75, -80);
  const chipColor = generateColors(roleColor, 0, -50, -50);
  const barColor = generateColors(roleColor, 0, -20, -10);
  const textColor = generateColors(roleColor, 0, 0, 0);

  // Draw the card shape
  context.fillStyle = cardLightColor;
  context.beginPath();
  context.roundRect(0, 20, 675, 272, [19]);
  context.roundRect(684, 20, 237, 272, [19]);
  context.fill();
  context.fillStyle = cardDarkColor;
  context.beginPath();
  context.roundRect(0, 0, 675, 145, [19]);
  context.roundRect(684, 0, 237, 205, [19]);
  context.fill();

  // WIP: Purchased Background

  // Get the existing inventory data
  // const inventoryData = await inventoryGet(personaData.id);
  // log.debug(F, `Persona home inventory (change): ${JSON.stringify(inventoryData, null, 2)}`);

  if (option === 'background' && imagePath) {
    const Background = await Canvas.loadImage(imagePath.toString());
    context.save();
    context.globalCompositeOperation = 'lighter';
    context.globalAlpha = 0.04;
    context.beginPath();
    context.roundRect(0, 0, 675, 292, [19]);
    context.roundRect(684, 0, 237, 292, [19]);
    context.clip();
    context.drawImage(Background, 0, 0);
    context.restore();
  }

  // Draw the chips
  context.fillStyle = chipColor;
  context.beginPath();
  context.roundRect(18, 163, 201, 51, [19]);
  context.roundRect(18, 223, 201, 51, [19]);
  context.roundRect(237, 163, 201, 51, [19]);
  context.roundRect(237, 223, 201, 51, [19]);
  context.roundRect(456, 163, 201, 51, [19]);
  context.roundRect(456, 223, 201, 51, [19]);
  context.roundRect(702, 223, 201, 51, [19]);
  context.fill();

  context.drawImage(Icons, 0, 0);

  // Overly complicated avatar clip (STATUS CLIP COMMENTED OUT)
  context.save();
  context.beginPath();
  context.arc(73, 73, 54, 0, Math.PI * 2, true);
  context.clip();
  // Avatar Image
  context.drawImage(avatar, 18, 18, 109, 109);
  context.restore();

  // WIP: Camp Icon
  // const CampIcon = await Canvas.loadImage(await imageGet('campIconA'));
  // context.drawImage(CampIcon, 547, 17);

  // WIP: Check to see if a user has bought a title in the shop
  // If so, move Username Text up so the title can fit underneath
  let userFont = 'futura';
  if (option === 'font' && fontName) {
    await getAsset(fontName);
    userFont = fontName;
  }
  // Username Text
  let filteredDisplayName = deFuckifyText(target.displayName);
  // If the filteredDisplayName is much shorter than what was input, display their username as a fallback
  if (filteredDisplayName.length < target.displayName.length / 2) {
    filteredDisplayName = target.user.username.charAt(0).toUpperCase() + target.user.username.slice(1);
  }

  context.fillStyle = textColor;
  context.font = `50px ${userFont}`;
  context.textAlign = 'left';
  let usernameHeight = 76;
  let fontSize: number;
  const maxLength = 508;
  const userFlair = 'Your Custom Flair Here';
  context.textBaseline = 'middle';

  if (option === 'userflair') {
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

  /* User Timezone
    context.font = '25px futura';
    context.textAlign = 'right';
    context.fillStyle = '#ffffff';
    if (profileData.timezone) {
      const timestring = new Date().toLocaleTimeString('en-US', {
        timeZone: profileData.timezone,
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
      });
      context.fillText(timestring, 210, 190);
    } else {
      context.fillText('NOT SET!', 210, 190);
    }

    // User Birthday
    let targetBirthday = {} as Date;
    let itIsYourBirthday = false;
    if (profileData.birthday) {
      targetBirthday = profileData.birthday;
      const today = new Date();
      if (today.getMonth() === targetBirthday.getMonth() && today.getDate() === targetBirthday.getDate()) {
        // log.debug(F, 'Birthday Match!');
        itIsYourBirthday = true;
      }
      if (targetBirthday.getDate() < 10) {
        context.fillText(`0${targetBirthday.getDate()} ${targetBirthday.toLocaleString('en-GB', { month: 'short' }).toUpperCase()}`, 210, 250);
      } else {
        context.fillText(`${targetBirthday.getDate()} ${targetBirthday.toLocaleString('en-GB', { month: 'short' }).toUpperCase()}`, 210, 250);
      }
    } else {
      context.fillText('NOT SET!', 210, 250);
    }

    // Messages Sent Text
    if (profileData.totalTextExp) {
      const MessagesSent = profileData.totalTextExp / 20;
      context.fillText(`${numFormatter(MessagesSent)}`, 429, 190);
    } else {
      context.fillText('0', 429, 190);
    }

    // Voice Hours Text
    if (profileData.totalTextExp) {
      const hoursInChat = (profileData.totalVoiceExp / 10 / 60);
      context.fillText(`${numFormatterVoice(hoursInChat)} HR`, 429, 250);
    } else {
      context.fillText('0 HR', 429, 250);
    }

    // Karma Text
    context.fillText(`${numFormatter(profileData.karma_received)}`, 648, 190);

    // Tokens Text
    context.fillText(`${numFormatter(profileData.tokens)}`, 648, 250);

    // Level Text
    const totalTextData = await getTotalLevel(profileData.totalTextExp);
    context.fillText(`${totalTextData.level}`, 894, 250); */
  /* // Choose and Draw the Level Image */
  // let LevelImagePath: string;
  // // if (totalTextData.level < 10) { /*
  // LevelImagePath = 'badgeVip0';
  //   } else if (totalTextData.level < 20) {
  //     LevelImagePath = 'badgeVip1';
  //   } else if (totalTextData.level < 30) {
  //     LevelImagePath = 'badgeVip2';
  //   } else if (totalTextData.level < 40) {
  //     LevelImagePath = 'badgeVip3';
  //   } else if (totalTextData.level < 50) {
  //     LevelImagePath = 'badgeVip4';
  //   } else if (totalTextData.level < 60) {
  //     LevelImagePath = 'badgeVip5';
  //   } else if (totalTextData.level < 70) {
  //     LevelImagePath = 'badgeVip6';
  //   } else if (totalTextData.level < 80) {
  //     LevelImagePath = 'badgeVip7';
  //   } else if (totalTextData.level < 90) {
  //     LevelImagePath = 'badgeVip8';
  //   } else if (totalTextData.level < 100) {
  //     LevelImagePath = 'badgeVip9';
  //   } else if (totalTextData.level >= 100) {
  //     LevelImagePath = 'badgeVip10';
  //   }
  // log.debug(F, `LevelImagePath: ${LevelImagePath}`);
  // const LevelImage = await Canvas.loadImage(await imageGet('badgeVip0'));
  // context.drawImage(LevelImage, 758, 57);

  // Level Bar Circle BG
  context.strokeStyle = chipColor;
  context.lineWidth = 18;
  context.beginPath();
  context.arc(802, 103, 76, 0, 2 * Math.PI);
  context.stroke();

  // Start at the 0 degrees position, in human terms, the 12 o'clock position
  const startDegrees = 0;
  // End degrees is the percentage of the level * 360 degrees, or a full circle
  const endDegrees = 180;

  // Canvas thinks that the "start" of a circle is the 3 o'clock position,
  // so we need to subtract 90 degrees from the start and end degrees to "rotate" the circle
  const startRadians = ((startDegrees - 90) * Math.PI) / 180;
  const endRadians = ((endDegrees - 90) * Math.PI) / 180;

  // Circular Level Bar
  context.strokeStyle = barColor;
  context.lineCap = 'round';
  context.lineWidth = 18;
  context.beginPath();
  context.arc(802, 103, 76, startRadians, endRadians);
  context.stroke();

  /* Birthday Mode
    if (itIsYourBirthday) {
      // log.debug(F, 'Birthday Match!');
      context.font = '40px futura';
      context.textAlign = 'left';
      context.fillStyle = textColor;
      context.fillText('HAPPY BIRTHDAY!', 146, 34);
      context.drawImage(birthdayOverlay, 0, 0, 934, 282);
    } */

  return (canvasObj.encode('png'));
}

export default dProfile;
