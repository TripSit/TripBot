/* eslint-disable max-len */
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
import { profile } from '../../../global/commands/g.profile';
import { startLog } from '../../utils/startLog';
import { expForNextLevel, getTotalLevel } from '../../../global/utils/experience';
import { getPersonaInfo } from '../../../global/commands/g.rpg';
import { inventoryGet } from '../../../global/utils/knex';
import { imageGet } from '../../utils/imageGet';

export default dProfile;

const F = f(__filename);

Canvas.GlobalFonts.registerFromPath(
  path.resolve(__dirname, '../../assets/Futura.otf'),
  'futura',
);

export const dProfile: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Get someone\'s profile!')
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

    // Get the target's profile data from the database
    const targetData = await profile(target.id);
    // log.debug(F, `target id: ${target.id}`);

    // Create Canvas and Context
    const canvasWidth = 921;
    const canvasHeight = 292;
    const canvasObj = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvasObj.getContext('2d');

    // Choose color based on user's role
    const cardLightColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardLightColor || '#141414';
    const cardDarkColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardDarkColor || '#101010';
    const chipColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.chipColor || '#202225';
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
    // Check get fresh persona data
    const [personaData] = await getPersonaInfo(target.user.id);
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
        context.roundRect(0, 0, 675, 292, [19]);
        context.roundRect(684, 0, 237, 292, [19]);
        context.clip();
        context.drawImage(Background, 0, 0);
        context.restore();
      }
    }

    // Load Icon Images
    const Icons = await Canvas.loadImage(await imageGet('cardIcons'));
    context.drawImage(Icons, 5, -2, 913, 292);

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

    // WIP: Camp Icon
    // const CampIcon = await Canvas.loadImage(await imageGet('campIconA'));
    // context.drawImage(CampIcon, 547, 17);

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
    context.textBaseline = 'middle';
    context.fillText(`${target.displayName}`, 146, 76);

    // User Timezone
    context.font = '25px futura';
    context.textAlign = 'right';
    context.fillStyle = '#ffffff';
    if (targetData.timezone) {
      const timestring = new Date().toLocaleTimeString('en-US', {
        timeZone: targetData.timezone,
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
    if (targetData.birthday) {
      targetBirthday = targetData.birthday;
      const today = new Date();
      if (today.getMonth() === targetBirthday.getMonth() && today.getDate() === targetBirthday.getDate()) {
        // log.debug(F, 'Birthday Match!');
        itIsYourBirthday = true;
      }
      if (targetBirthday.getDate() < 10) {
        context.fillText(`0${targetBirthday.getDate()} ${targetBirthday.toLocaleString('en-GB', { month: 'short' }).toUpperCase()}`, 205, 250);
      } else {
        context.fillText(`${targetBirthday.getDate()} ${targetBirthday.toLocaleString('en-GB', { month: 'short' }).toUpperCase()}`, 205, 250);
      }
    } else {
      context.fillText('NOT SET!', 210, 250);
    }

    // Messages Sent Text
    if (targetData.totalTextExp) {
      const MessagesSent = targetData.totalTextExp / 20;
      context.fillText(`${numFormatter(MessagesSent)}`, 429, 190);
    } else {
      context.fillText('0', 429, 190);
    }

    // Voice Hours Text
    if (targetData.totalTextExp) {
      const hoursInChat = (targetData.totalVoiceExp / 10 / 60);
      context.fillText(`${numFormatter(hoursInChat)} HR`, 429, 250);
    } else {
      context.fillText('0 HR', 429, 250);
    }

    // Karma Text
    context.fillText(`${numFormatter(targetData.karma_received)}`, 648, 190);

    // Tokens Text
    context.fillText(`${numFormatter(targetData.tokens)}`, 648, 250);

    // Level Text
    const totalTextData = await getTotalLevel(targetData.totalTextExp);
    context.fillText(`${totalTextData.level}`, 894, 250);

    // Choose and Draw the Level Image
    let LevelImagePath = '' as string;

    if (totalTextData.level < 10) {
      LevelImagePath = await imageGet('badgeVip0');
    } else if (totalTextData.level < 20) {
      LevelImagePath = await imageGet('badgeVip1');
    } else if (totalTextData.level < 30) {
      LevelImagePath = await imageGet('badgeVip2');
    } else if (totalTextData.level < 40) {
      LevelImagePath = await imageGet('badgeVip3');
    } else if (totalTextData.level < 50) {
      LevelImagePath = await imageGet('badgeVip4');
    } else if (totalTextData.level < 60) {
      LevelImagePath = await imageGet('badgeVip5');
    } else if (totalTextData.level < 70) {
      LevelImagePath = await imageGet('badgeVip6');
    } else if (totalTextData.level < 80) {
      LevelImagePath = await imageGet('badgeVip7');
    } else if (totalTextData.level < 90) {
      LevelImagePath = await imageGet('badgeVip8');
    } else if (totalTextData.level < 100) {
      LevelImagePath = await imageGet('badgeVip9');
    } else if (totalTextData.level >= 100) {
      LevelImagePath = await imageGet('badgeVip10');
    }
    // log.debug(F, `LevelImagePath: ${LevelImagePath}`);
    const LevelImage = await Canvas.loadImage(LevelImagePath);
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
    log.debug(F, `percentageOfLevel: ${percentageOfLevel}`);

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
    context.strokeStyle = textColor;
    context.lineCap = 'round';
    context.lineWidth = 18;
    context.beginPath();
    context.arc(802, 103, 76, startRadians, endRadians);
    context.stroke();

    // Birthday Mode
    if (itIsYourBirthday) {
      log.debug(F, 'Birthday Match!');
      context.font = '40px futura';
      context.textAlign = 'left';
      context.fillStyle = textColor;
      context.fillText('HAPPY BIRTHDAY!', 146, 34);
      const birthdayOverlay = await Canvas.loadImage(await imageGet('cardBirthday'));
      context.drawImage(birthdayOverlay, 0, 0, 934, 282);
    }

    // Process The Entire Card and Send it to Discord
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), { name: 'tripsit-profile-image.png' });
    interaction.editReply({ files: [attachment] });

    log.debug(F, `Total Time: ${Date.now() - startTime}ms`);
    return true;
  },
};

/**
     * Messages Sent Text
     * @param {number} num - Number to format
     * @return {string}
     */
export function numFormatter(num:number):string {
  if (num > 999 && num < 1000000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  if (num > 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  return num.toFixed(0);
}

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
    cardDarkColor: '#1a2022',
    cardLightColor: '#2c383c',
    chipColor: '#225161',
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
