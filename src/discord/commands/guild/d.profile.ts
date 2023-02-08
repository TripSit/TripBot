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
// import { startLog } from '../../utils/startLog';
import { expForNextLevel, getTotalLevel } from '../../../global/utils/experience';
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

export default dProfile;

export const dProfile: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Return the user\'s profile!')
    .addUserOption(option => option
      .setName('target')
      .setDescription('User to get info on!')),
  async execute(
    interaction:ChatInputCommandInteraction | UserContextMenuCommandInteraction,
  ) {
    // startLog(F, interaction);

    if (!interaction.guild) {
      interaction.reply('You can only use this command in a guild!');
      return false;
    }
    await interaction.deferReply();

    // Target is the option given, if none is given, it will be the user who used the command
    const target = interaction.options.getMember('target')
      ? interaction.options.getMember('target') as GuildMember
      : interaction.member as GuildMember;

    const targetData = await profile(target.id);

    // Create Canvas and Context
    const canvasWidth = 918;
    const canvasHeight = 292;
    const canvasObj = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvasObj.getContext('2d');

    // Choose color based on user's role
    const cardLightColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardLightColor || '#141414';
    const cardDarkColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.cardDarkColor || '#101010';
    const chipColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.chipColor || '#202225';
    const textColor = colorDefs[target.roles.color?.id as keyof typeof colorDefs]?.textColor || '#ffffff';

    // const colorRole = target.roles.color;

    // Draw the card shape and chips
    // Card
    context.fillStyle = cardLightColor;
    context.beginPath();
    context.roundRect(0, 0, 675, 292, [19]);
    context.roundRect(684, 0, 234, 292, [19]);
    context.fillStyle = cardDarkColor;
    context.beginPath();
    context.roundRect(0, 0, 675, 145, [19]);
    context.roundRect(684, 0, 234, 206, [19]);
    context.fill();
    // Chips
    context.fillStyle = chipColor;
    context.beginPath();
    context.roundRect(18, 165, 201, 51, [19]);
    context.roundRect(18, 225, 201, 51, [19]);
    context.roundRect(237, 165, 201, 51, [19]);
    context.roundRect(237, 225, 201, 51, [19]);
    context.roundRect(456, 165, 201, 51, [19]);
    context.roundRect(456, 225, 201, 51, [19]);
    context.roundRect(702, 225, 201, 51, [19]);
    context.arc(603, 73, 54, 0, Math.PI * 2, true);
    context.fill();
    // Level Bar Circle BG
    context.strokeStyle = textColor;
    context.lineWidth = 18;
    context.beginPath();
    context.arc(801, 104, 77, 0, 2 * Math.PI);
    context.stroke();

    // WIP: Purchased Background
    // Check get fresh persona data
    const [personaData] = await getPersonaInfo(interaction.user.id);
    // log.debug(F, `personaData home (Change) ${JSON.stringify(personaData, null, 2)}`);

    if (personaData) {
      // Get the existing inventory data
      const inventoryData = await inventoryGet(personaData.id);
      // log.debug(F, `Persona home inventory (change): ${JSON.stringify(inventoryData, null, 2)}`);

      const equippedBackground = inventoryData.find(item => item.equipped === true);
      log.debug(F, `equippedBackground: ${JSON.stringify(equippedBackground, null, 2)} `);
      if (equippedBackground) {
        const imagePath = await imageGet(equippedBackground.value);
        // const Background = await Canvas.loadImage('https://i.gyazo.com/adfbab1d3fdeadef74ec18ce6efe869c.png');
        const Background = await Canvas.loadImage(imagePath);
        // const Background = await Canvas.loadImage(path.join(__dirname, '..', '..', 'assets', 'img', 'cards', 'background.png'));
        context.save();
        context.globalCompositeOperation = 'lighten';
        context.globalAlpha = 0.03;
        context.beginPath();
        context.roundRect(0, 0, 675, 292, [19]);
        context.roundRect(684, 0, 234, 292, [19]);
        context.clip();
        context.drawImage(Background, 0, 0);
        context.restore();
      }
    }

    // Load Icon Images
    const Icons = await Canvas.loadImage('https://i.gyazo.com/6669a36a7adf68996354bd7586cd7083.png');
    // const Icons = await Canvas.loadImage(path.join(__dirname, '..', '..', 'assets', 'img', 'cards', 'icons.png'));
    context.drawImage(Icons, 5, 0, 913, 292);

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
    context.arc(109, 113, 21, 0, Math.PI * 2, true);
    context.closePath();
    context.fillStyle = cardDarkColor;
    context.fill();
    context.restore();

    // const StatusIconPath = target.presence
    //   ? path.join(__dirname, '..', '..', 'assets', 'img', 'icons', `${target.presence?.status}.png`)
    //   : path.join(__dirname, '..', '..', 'assets', 'img', 'icons', 'offline.png');

    // log.debug(F, `StatusIconPath: ${StatusIconPath}`);

    let StatusIconPath = 'https://i.gyazo.com/b2b1bf7d91acdb4ccc72dfde3d7075fc.png';
    if (target.presence) {
      if (target.presence.status === 'online') {
        // StatusIconPath = `.\\src\\discord\\assets\\img\\icons\\${target.presence!.status}.png`;
        StatusIconPath = 'https://i.gyazo.com/cd7b9e018d4818e4b6588cab5d5b019d.png';
      } else if (target.presence.status === 'idle') {
        // StatusIconPath = `.\\src\\discord\\assets\\img\\icons\\${target.presence!.status}.png`;
        StatusIconPath = 'https://i.gyazo.com/df8f4a4ca2553d4d657ee82e4bf64a3a.png';
      } else if (target.presence.status === 'dnd') {
        // StatusIconPath = `.\\src\\discord\\assets\\img\\icons\\${target.presence!.status}.png`;
        StatusIconPath = 'https://i.gyazo.com/a98f0e9dd72f6fb59af388d719d01e64.png';
      }
    }

    // WIP: Camp Icon
    const CampIconPath = 'https://i.gyazo.com/62a9db6c42ca3c03cc892b28f5d8b367.png';
    const CampIcon = await Canvas.loadImage(CampIconPath);
    context.drawImage(CampIcon, 547, 17);

    try {
      const StatusIcon = await Canvas.loadImage(StatusIconPath);
      context.drawImage(StatusIcon, 88, 92);
    } catch (err) {
      log.error(F, `Error loading status icon: ${err}`);
    }

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
    context.fillText(`${target.displayName}`, 146, 70);

    // User Timezone and Birthday Text
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
      context.fillText(timestring, 210, 189);
    } else {
      context.fillText('NOT SET!', 210, 189);
    }

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
        context.fillText(`0${targetBirthday.getDate()} ${targetBirthday.toLocaleString('en-GB', { month: 'short' }).toUpperCase()}`, 205, 248);
      } else {
        context.fillText(`${targetBirthday.getDate()} ${targetBirthday.toLocaleString('en-GB', { month: 'short' }).toUpperCase()}`, 205, 248);
      }
    } else {
      context.fillText('NOT SET!', 210, 248);
    }

    /**
     * Messages Sent Text
     * @param {number} num
     * @return {string}
     */
    function numFormatter(num:number):string {
      if (num > 999 && num < 1000000) {
        return `${(num / 1000).toFixed(2)}K`;
      }
      if (num > 1000000) {
        return `${(num / 1000000).toFixed(2)}M`;
      }
      return num.toFixed(0);
    }

    // Messages Sent Text
    if (targetData.totalTextExp) {
      const MessagesSent = targetData.totalTextExp / 20;
      context.fillText(`${numFormatter(MessagesSent)}`, 429, 189);
    } else {
      context.fillText('0', 429, 189);
    }

    // WIP: Voice Hours Text
    if (targetData.totalTextExp) {
      const minsInChat = (targetData.totalVoiceExp / 10) / 2;
      context.fillText(`${numFormatter(minsInChat)}`, 429, 248);
    } else {
      context.fillText('0', 429, 248);
    }

    // Karma Text
    context.fillText(`${numFormatter(targetData.karma_received)}`, 648, 189);

    // Tokens Text
    context.fillText(`${numFormatter(targetData.tokens)}`, 648, 248);

    // Level Text
    const totalTextData = await getTotalLevel(targetData.totalTextExp);
    context.fillText(`${totalTextData.level}`, 894, 248);

    // Get the first number of the level
    // const levelTier = Math.floor(totalData.level / 10);

    // try {
    //   // log.debug(F, `LevelImagePath: ${LevelImagePath}`);
    //   const LevelImage = await Canvas.loadImage(path.join(__dirname, '..', '..', 'assets', 'img', 'badges', `VIP${levelTier}.png`));
    //   context.drawImage(LevelImage, 756, 59, 90, 90);
    // } catch (err) {
    //   log.error(F, `Error loading star image: ${err}`);
    // }

    // Choose and Draw the Level Image
    let LevelImagePath = 'https://i.gyazo.com/13daebdda4ca75ab59923396f255f7db.png';

    if (totalTextData.level < 10) {
      LevelImagePath = 'https://i.gyazo.com/13daebdda4ca75ab59923396f255f7db.png';
    } else if (totalTextData.level < 20) {
      LevelImagePath = 'https://i.gyazo.com/5d37a2d3193c4c7e8a033b6b2ed7cb7f.png';
    } else if (totalTextData.level < 30) {
      LevelImagePath = 'https://i.gyazo.com/161506f23b1907ac1280db26ead5a0a4.png';
    } else if (totalTextData.level < 40) {
      LevelImagePath = 'https://i.gyazo.com/4bd15a019f7fd5c881e196c38a8b8bf5.png';
    } else if (totalTextData.level < 50) {
      LevelImagePath = 'https://i.gyazo.com/ca0b1aca00a71a992c196ca0498efef3.png';
    } else if (totalTextData.level < 60) {
      LevelImagePath = 'https://i.gyazo.com/f614a14051dbc1366ce4de2ead98a519.png';
    } else if (totalTextData.level < 70) {
      LevelImagePath = 'https://i.gyazo.com/3844d103c034f16e781fd947f593895c.png';
    } else if (totalTextData.level < 80) {
      LevelImagePath = 'https://i.gyazo.com/0357a63887c1183d53827eb8ebb29ee3.png';
    } else if (totalTextData.level < 90) {
      LevelImagePath = 'https://i.gyazo.com/693948d030989ffa5bf5e381f471bac6.png';
    } else if (totalTextData.level < 100) {
      LevelImagePath = 'https://i.gyazo.com/eed9e28789262927cefe0a68b3126ed2.png';
    } else if (totalTextData.level >= 100) {
      LevelImagePath = 'https://i.gyazo.com/4428c08aaf82b7363fb7a327ce27a4c3.png';
    }

    try {
      // log.debug(F, `LevelImagePath: ${LevelImagePath}`);
      const LevelImage = await Canvas.loadImage(LevelImagePath);
      context.drawImage(LevelImage, 756, 59, 90, 90);
    } catch (err) {
      log.error(F, `Error loading star image: ${err}`);
    }

    // Level Bar Math
    let percentageOfLevel = 0;
    const expToLevel = await expForNextLevel(totalTextData.level);
    percentageOfLevel = (totalTextData.level_points / expToLevel);
    log.debug(F, `percentageOfLevel: ${percentageOfLevel}`);

    // Circular Level Bar
    context.strokeStyle = textColor;
    context.lineCap = 'round';
    context.lineWidth = 18;
    context.beginPath();
    // context.arc(801, 104, 77, 1.5 * Math.PI, (0.70 * 1.4999) * Math.PI, false);

    // Start at the 0 degrees position, in human terms, the 12 o'clock position
    const startDegrees = 0;
    // End degrees is the percentage of the level * 360 degrees, or a full circle
    const endDegrees = 360 * percentageOfLevel;

    // Canvas thinks that the "start" of a circle is the 3 o'clock position,
    // so we need to subtract 90 degrees from the start and end degrees to "rotate" the circle
    const startRadians = ((startDegrees - 90) * Math.PI) / 180;
    const endRadians = ((endDegrees - 90) * Math.PI) / 180;

    context.arc(801, 104, 77, startRadians, endRadians);
    context.stroke();

    // context.save();
    // context.translate(0, 282);
    // context.rotate((270 * Math.PI) / 180);
    // context.beginPath();
    // context.lineWidth = 21;
    // context.lineCap = 'round';
    // context.arc(141, 807, 86, 0, Math.PI * (percentageOfLevel * 2), false);
    // context.strokeStyle = textColor;
    // context.stroke();
    // context.restore();

    // Birthday Mode
    if (itIsYourBirthday) {
      log.debug(F, 'Birthday Match!');
      context.font = '45px futura';
      context.textAlign = 'center';
      context.fillStyle = textColor;
      context.fillText('HAPPY BIRTHDAY!', 467, 55);
      const birthdayOverlay = await Canvas.loadImage('https://i.imgur.com/uOkR6uf.png');
      // const birthdayOverlay = await Canvas.loadImage(path.join(__dirname, '..', '..', 'assets', 'img', 'cards', 'birthday.png'));
      context.drawImage(birthdayOverlay, 0, 0, 934, 282);
    }

    // Process The Entire Card and Send it to Discord
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), { name: 'tripsit-profile-image.png' });
    interaction.editReply({ files: [attachment] });
    return true;
  },
};
