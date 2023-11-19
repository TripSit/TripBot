/* eslint-disable max-len */
import * as path from 'path';
import {
  SlashCommandBuilder,
  GuildMember,
  AttachmentBuilder,
} from 'discord.js';
import Canvas from '@napi-rs/canvas';
import { PrismaClient, personas } from '@prisma/client';
import { SlashCommand } from '../../@types/commandDef';
import { profile, ProfileData } from '../../../global/commands/g.profile';
import commandContext from '../../utils/context';
import { expForNextLevel, getTotalLevel } from '../../../global/utils/experience';
import { getPersonaInfo } from '../../../global/commands/g.rpg';
import getAsset from '../../utils/getAsset';

const db = new PrismaClient({ log: ['error'] });

// ??? TO BE MOVED TO A DEDICATED FILE, OR IMAGEGET.TS ???
// Load external fonts from web

const F = f(__filename);

Canvas.GlobalFonts.registerFromPath(
  path.resolve(__dirname, '../../assets/Futura.otf'),
  'futura',
);

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

export const dProfile: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Get someone\'s profile!')
    .addUserOption(option => option
      .setName('target')
      .setDescription('User to lookup'))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(
    interaction,
  ) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const startTime = Date.now();
    if (!interaction.guild) {
      await interaction.editReply({ content: 'You can only use this command in a guild!' });
      return false;
    }

    // Target is the option given, if none is given, it will be the user who used the command
    const target = interaction.options.getMember('target')
      ? interaction.options.getMember('target') as GuildMember
      : interaction.member as GuildMember;

    // log.debug(F, `target.presence?.status: ${target.presence?.status}`);

    const values = await Promise.allSettled([

      // Get the target's profile data from the database
      await profile(target.id),
      // Check get fresh persona data
      await getPersonaInfo(target.user.id),
      // Load Icon Images
      await Canvas.loadImage(await getAsset('cardIcons')),
      // Get the status icon
      // await Canvas.loadImage(await imageGet(`icon_${target.presence?.status ?? 'offline'}`)),
      // Get the avatar image
      await Canvas.loadImage(target.user.displayAvatarURL({ extension: 'jpg' })),
      // Get the birthday card overlay
      await Canvas.loadImage(await getAsset('cardBirthday')),
      await Canvas.loadImage(await getAsset('teamtripsitIcon')),
      await Canvas.loadImage(await getAsset('premiumIcon')),
      await Canvas.loadImage(await getAsset('boosterIcon')),
      await Canvas.loadImage(await getAsset('legacyIcon')),
    ]);

    const profileData = values[0].status === 'fulfilled' ? values[0].value : {} as ProfileData;
    const personaData = values[1].status === 'fulfilled' ? values[1].value : {} as personas;
    const Icons = values[2].status === 'fulfilled' ? values[2].value : {} as Canvas.Image;
    // const StatusIcon = values[3].status === 'fulfilled' ? values[3].value : {} as Canvas.Image;
    const avatar = values[3].status === 'fulfilled' ? values[3].value : {} as Canvas.Image;
    const birthdayOverlay = values[4].status === 'fulfilled' ? values[4].value : {} as Canvas.Image;
    const teamtripsitIcon = values[5].status === 'fulfilled' ? values[5].value : {} as Canvas.Image;
    const premiumIcon = values[6].status === 'fulfilled' ? values[6].value : {} as Canvas.Image;
    const boosterIcon = values[7].status === 'fulfilled' ? values[7].value : {} as Canvas.Image;
    const legacyIcon = values[8].status === 'fulfilled' ? values[8].value : {} as Canvas.Image;

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

    // Create Canvas and Context
    const canvasWidth = 921;
    const canvasHeight = 292;
    const canvasObj = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvasObj.getContext('2d');

    // Choose color based on user's role
    const cardLightColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardLightColor || '#232323';
    const cardDarkColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardDarkColor || '#141414';
    const chipColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.chipColor || '#393939';
    const barColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.barColor || '#b3b3b3';
    const textColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.textColor || '#ffffff';

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
    // context.arc(603, 73, 54, 0, Math.PI * 2, true); // CAMP ICON CHIP
    context.fill();

    // WIP: Purchased Background

    // log.debug(F, `personaData home (Change) ${JSON.stringify(personaData, null, 2)}`);
    let userFont = 'futura';
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
      // log.debug(F, `equippedBackground: ${JSON.stringify(equippedBackground, null, 2)} `);
      if (equippedBackground) {
        const imagePath = await getAsset(equippedBackground.value);
        const Background = await Canvas.loadImage(imagePath);
        context.save();
        context.globalCompositeOperation = 'lighter';
        context.globalAlpha = 0.03;
        context.beginPath();
        context.roundRect(0, 0, 675, 292, [19]);
        context.roundRect(684, 0, 237, 292, [19]);
        context.clip();
        context.drawImage(Background, 0, 0);
        context.restore();
      }
      if (equippedFont) {
        await getAsset(equippedFont.value);
        userFont = equippedFont.value;
      }
    }

    context.drawImage(Icons, 0, 0);

    /* TEST: Border item
    context.save();
    context.beginPath();
    context.roundRect(0, 0, 675, 292, [19]);
    context.roundRect(684, 0, 237, 292, [19]);
    context.clip();
    context.globalAlpha = 1;
    context.strokeStyle = '#000000';
    context.lineWidth = 16;
    context.stroke();
    context.globalCompositeOperation = 'lighten';
    context.strokeStyle = '#3a5760';
    context.stroke();
    context.restore(); */

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

    // WIP: Camp Icon
    // const CampIcon = await Canvas.loadImage(await imageGet('campIconA'));
    // context.drawImage(CampIcon, 547, 17);

    // WIP: Check to see if a user has bought a title in the shop
    // If so, move Username Text up so the title can fit underneath

    // Username Text Resize to fit
    let fontSize = 40;
    const applyUsername = (canvas:Canvas.Canvas, text:string) => {
      const usernameContext = canvas.getContext('2d');
      do {
        fontSize -= 2;
        usernameContext.font = `${fontSize}px ${userFont}`;
      } while (usernameContext.measureText(text).width > 530);
      return usernameContext.font;
    };

    // Username Text
    const filteredDisplayName = target.displayName.replace(/[^A-Za-z0-9]/g, '');
    context.font = `40px ${userFont}`;
    context.fillStyle = textColor;
    context.textBaseline = 'middle';
    context.font = applyUsername(canvasObj, `${filteredDisplayName}`);
    context.fillText(`${filteredDisplayName}`, 146, 76);

    // User Timezone
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
    const totalTextData = await getTotalLevel(profileData.totalTextExp + profileData.totalVoiceExp);
    context.fillText(`${totalTextData.level}`, 894, 250);

    // Choose and Draw the Level Image
    let LevelImagePath = '' as string;
    if (totalTextData.level <= 9) {
      LevelImagePath = 'badgeVip0';
    } else if (totalTextData.level <= 19) {
      LevelImagePath = 'badgeVip1';
    } else if (totalTextData.level <= 29) {
      LevelImagePath = 'badgeVip2';
    } else if (totalTextData.level <= 39) {
      LevelImagePath = 'badgeVip3';
    } else if (totalTextData.level <= 49) {
      LevelImagePath = 'badgeVip4';
    } else if (totalTextData.level <= 59) {
      LevelImagePath = 'badgeVip5';
    } else if (totalTextData.level <= 69) {
      LevelImagePath = 'badgeVip6';
    } else if (totalTextData.level <= 79) {
      LevelImagePath = 'badgeVip7';
    } else if (totalTextData.level <= 89) {
      LevelImagePath = 'badgeVip8';
    } else if (totalTextData.level <= 99) {
      LevelImagePath = 'badgeVip9';
    } else if (totalTextData.level >= 100) {
      LevelImagePath = 'badgeVip10';
    }
    // log.debug(F, `LevelImagePath: ${LevelImagePath}`);
    const LevelImage = await Canvas.loadImage(await getAsset(LevelImagePath));
    context.drawImage(LevelImage, 758, 57);

    // Level Bar Circle BG
    context.strokeStyle = chipColor;
    context.lineWidth = 18;
    context.beginPath();
    context.arc(802, 103, 76, 0, 2 * Math.PI);
    context.stroke();

    // Level Bar Math
    let percentageOfLevel = 0;
    const expToLevel = await expForNextLevel(totalTextData.level);
    percentageOfLevel = (totalTextData.level_points / expToLevel);
    // log.debug(F, `percentageOfLevel: ${percentageOfLevel}`);

    // Start at the 0 degrees position, in human terms, the 12 o'clock position
    const startDegrees = 0;
    // End degrees is the percentage of the level * 360 degrees, or a full circle
    const endDegrees = 360 * percentageOfLevel;
    // log.debug(F, `startDegrees: ${startDegrees}`);
    // log.debug(F, `endDegrees: ${endDegrees}`);

    // Canvas thinks that the "start" of a circle is the 3 o'clock position,
    // so we need to subtract 90 degrees from the start and end degrees to "rotate" the circle
    const startRadians = ((startDegrees - 90) * Math.PI) / 180;
    const endRadians = ((endDegrees - 90) * Math.PI) / 180;
    // log.debug(F, `startRadians: ${startRadians}`);
    // log.debug(F, `endRadians: ${endRadians}`);

    // Circular Level Bar
    context.strokeStyle = barColor;
    context.lineCap = 'round';
    context.lineWidth = 18;
    context.beginPath();
    context.arc(802, 103, 76, startRadians, endRadians);
    context.stroke();

    // Birthday Mode
    if (itIsYourBirthday) {
      // log.debug(F, 'Birthday Match!');
      context.font = '40px futura';
      context.textAlign = 'left';
      context.fillStyle = textColor;
      context.fillText('HAPPY BIRTHDAY!', 146, 34);
      context.drawImage(birthdayOverlay, 0, 0, 934, 282);
    }

    // Process The Entire Card and Send it to Discord
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), { name: 'tripsit-profile-image.png' });
    await interaction.editReply({ files: [attachment] });

    log.info(F, `Total Time: ${Date.now() - startTime}ms`);
    return true;
  },
};

export async function getProfilePreview(target: GuildMember, option: string, imagePath?: string, fontName?: string): Promise<Buffer> {
  const values = await Promise.allSettled([

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
  ]);
  // const profileData = values[0].status === 'fulfilled' ? values[0].value : {} as ProfileData;
  // const [personaData] = values[1].status === 'fulfilled' ? values[1].value : [];
  const Icons = values[0].status === 'fulfilled' ? values[0].value : {} as Canvas.Image;
  // const StatusIcon = values[3].status === 'fulfilled' ? values[3].value : {} as Canvas.Image;
  const avatar = values[1].status === 'fulfilled' ? values[1].value : {} as Canvas.Image;
  // const birthdayOverlay = values[4].status === 'fulfilled' ? values[4].value : {} as Canvas.Image;

  // Create Canvas and Context
  const canvasWidth = 921;
  const canvasHeight = 292;
  const canvasObj = Canvas.createCanvas(canvasWidth, canvasHeight);
  const context = canvasObj.getContext('2d');

  // Choose color based on user's role
  const cardLightColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardLightColor || '#232323';
  const cardDarkColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardDarkColor || '#141414';
  const chipColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.chipColor || '#393939';
  const barColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.barColor || '#b3b3b3';
  const textColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.textColor || '#ffffff';

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
  // context.arc(603, 73, 54, 0, Math.PI * 2, true); // CAMP ICON CHIP
  context.fill();

  // WIP: Purchased Background

  // log.debug(F, `personaData home (Change) ${JSON.stringify(personaData, null, 2)}`);

  // Get the existing inventory data
  // const inventoryData = await inventoryGet(personaData.id);
  // log.debug(F, `Persona home inventory (change): ${JSON.stringify(inventoryData, null, 2)}`);

  // const equippedBackground = inventoryData.find(item => item.equipped === true && item.effect === 'background');

  if (option === 'background' && imagePath) {
    const Background = await Canvas.loadImage(imagePath.toString());
    context.save();
    context.globalCompositeOperation = 'lighter';
    context.globalAlpha = 0.03;
    context.beginPath();
    context.roundRect(0, 0, 675, 292, [19]);
    context.roundRect(684, 0, 237, 292, [19]);
    context.clip();
    context.drawImage(Background, 0, 0);
    context.restore();
  }

  context.drawImage(Icons, 0, 0);

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
  // Avatar Image
  context.drawImage(avatar, 18, 18, 109, 109);
  context.restore();
  // context.drawImage(StatusIcon, 90, 92);

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
  const filteredDisplayName = target.displayName.replace(/[^A-Za-z0-9]/g, '');
  // Username Text
  let fontSize = 40;
  // eslint-disable-next-line sonarjs/no-identical-functions
  const applyUsername = (canvas:Canvas.Canvas, text:string) => {
    const usernameContext = canvas.getContext('2d');
    do {
      fontSize -= 2;
      usernameContext.font = `${fontSize}px ${userFont}`;
    } while (usernameContext.measureText(text).width > 530);
    return usernameContext.font;
  };
  context.font = applyUsername(canvasObj, `${filteredDisplayName}`);
  context.fillStyle = textColor;
  if (option === 'profileTitle') {
    context.textBaseline = 'bottom';
    context.fillText(`${filteredDisplayName}`, 146, 76);
    context.font = '30px futura';
    context.textBaseline = 'top';
    context.fillText('Your Custom Title Here', 146, 86);
  } else {
    context.textBaseline = 'middle';
    context.fillText(`${filteredDisplayName}`, 146, 76);
  }

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

  /* // Level Bar Math
    let percentageOfLevel = 0;
    const expToLevel = await expForNextLevel(totalTextData.level);
    percentageOfLevel = (totalTextData.level_points / expToLevel);
    // log.debug(F, `percentageOfLevel: ${percentageOfLevel}`); */

  // Start at the 0 degrees position, in human terms, the 12 o'clock position
  const startDegrees = 0;
  // End degrees is the percentage of the level * 360 degrees, or a full circle
  const endDegrees = 180;
  // log.debug(F, `startDegrees: ${startDegrees}`);
  // log.debug(F, `endDegrees: ${endDegrees}`);

  // Canvas thinks that the "start" of a circle is the 3 o'clock position,
  // so we need to subtract 90 degrees from the start and end degrees to "rotate" the circle
  const startRadians = ((startDegrees - 90) * Math.PI) / 180;
  const endRadians = ((endDegrees - 90) * Math.PI) / 180;
  // log.debug(F, `startRadians: ${startRadians}`);
  // log.debug(F, `endRadians: ${endRadians}`);

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
