/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  UserContextMenuCommandInteraction,
  GuildMember,
  AttachmentBuilder,
} from 'discord.js';
import {userDbEntry} from '../../../global/@types/database';
import {SlashCommand} from '../../@types/commandDef';
import {userExample} from '../../../global/utils/exampleUser';
// import timezones from '../../../global/assets/data/timezones.json';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import Canvas from '@napi-rs/canvas';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

Canvas.GlobalFonts.registerFromPath(
  path.resolve(__dirname, '../../assets/img/Futura.otf'),
  'futura',
);

export const profile: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Return the user\'s profile!')
    .addUserOption((option) => option
      .setName('target')
      .setDescription('User to get info on!')),
  async execute(
    interaction:ChatInputCommandInteraction | UserContextMenuCommandInteraction) {
    const target = interaction.options.getMember('target') ?
      interaction.options.getMember('target') as GuildMember :
      interaction.member as GuildMember;

    if (!interaction.guild) {
      interaction.reply('You can only use this command in a guild!');
      return;
    }

    // Choose colour based on user's role
    // const defaultCard = path.resolve(__dirname, '../../assets/img/cards/profilecardDefault.png');
    const defaultCard = 'https://i.imgur.com/WKfLb8T.png';
    let coloredCard = defaultCard;
    let cardColor = '#141414';
    let textColor = '#ffffff';

    const colorRole = target.roles.color;
    logger.debug(`[${PREFIX}] colorRole: ${colorRole?.id}`);
    if (colorRole) {
      if (colorRole.id === env.ROLE_PURPLE) {
        // const purpleCard = path.resolve(__dirname, '../../assets/img/cards/profilecardPurple.png')
        const purpleCard = 'https://i.imgur.com/UOV7Bkn.png';
        coloredCard = purpleCard;
        cardColor = '#2d2636';
        // chipColor = '#FFC0CB';
        textColor = '#b072ff';
      } else if (colorRole.id === env.ROLE_BLUE) {
        // coloredCard = path.resolve(__dirname, '../../assets/img/cards/profilecardBlue.png');
        coloredCard = 'https://i.imgur.com/76P7af1.png';
        cardColor = '#283438';
        // chipColor = '#FFA500';
        textColor = '#5acff5';
      } else if (colorRole.id === env.ROLE_GREEN) {
        // coloredCard = path.resolve(__dirname, '../../assets/img/cards/profilecardGreen.png');
        coloredCard = 'https://i.imgur.com/eNQWeSM.png';
        cardColor = '#252e28';
        // chipColor = '#00FF00';
        textColor = '#6de194';
      } else if (colorRole.id === env.ROLE_PINK) {
        // coloredCard = path.resolve(__dirname, '../../assets/img/cards/profilecardPink.png');
        coloredCard = 'https://i.imgur.com/DHp5Cwl.png';
        cardColor = '#352530';
        // chipColor = '#FF0000';
        textColor = '#ff6dcd';
      } else if (colorRole.id === env.ROLE_RED) {
        // coloredCard = path.resolve(__dirname, '../../assets/img/cards/profilecardRed.png');
        coloredCard = 'https://i.imgur.com/HBM5RLI';
        cardColor = '#382727';
        // chipColor = '#FF0000';
        textColor = '#ff5f60';
      } else if (colorRole.id === env.ROLE_ORANGE) {
        // coloredCard = path.resolve(__dirname, '../../assets/img/cards/profilecardOrange.png');
        coloredCard = 'https://i.imgur.com/oagaenH.png';
        cardColor = '#342b24';
        // chipColor = '#FFA500';
        textColor = '#ffa45f';
      } else if (colorRole.id === env.ROLE_YELLOW) {
        // coloredCard = path.resolve(__dirname, '../../assets/img/cards/profilecardYellow.png');
        coloredCard = 'https://i.imgur.com/C0zd92H.png';
        cardColor = '#333024';
        // chipColor = '#FFFF00';
        textColor = '#ffdd5d';
      } else if (colorRole.id === env.ROLE_WHITE) {
        // coloredCard = path.resolve(__dirname, '../../assets/img/cards/profilecardWhite.png');
        coloredCard = 'https://i.imgur.com/7KGS566.png';
        cardColor = '#404040';
        // chipColor = '#FFFFFF';
        textColor = '#ffffff';
      } else if (colorRole.id === env.ROLE_BLACK) {
        // coloredCard = path.resolve(__dirname, '../../assets/img/cards/profilecardBlack.png');
        coloredCard = 'https://i.imgur.com/0QgZvFi.png';
        cardColor = '#181818';
        // chipColor = '#000000';
        textColor = '#626262';
      }
    }
    logger.debug(`[${PREFIX}] cardColor: ${cardColor} | textColor: ${textColor} | coloredCard: ${coloredCard}`);

    // Create Canvas and Context
    const canvasWidth = 934;
    const canvasHeight = 282;
    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvas.getContext('2d');

    logger.debug(`[${PREFIX}] canvas created`);

    // Backround Image
    try {
      // Doesn't work on windows
      // TypeError [ERR_INVALID_PROTOCOL]: Protocol "c:" not supported. Expected "http:"
      // const tryA = `C:\Projects\TS\tripsit-discord-bot\src\discord\assets\img\cards\profilecardDefault.png`;
      // logger.debug(`[${PREFIX}] tryA: ${tryA}`);
      // Doesnt work on Linux
      // tryB: /workspace/src/discord/assets/img/cards/profilecardDefault.png
      // const tryB = path.resolve(__dirname, '../../assets/img/cards/profilecardDefault.png');
      // /workspace/src/discord/assets/img/cards/profilecardDefault.png
      // logger.debug(`[${PREFIX}] tryB: ${tryB}`);
      // const tryC = path.join(__dirname, '../../assets/img/cards/profilecardDefault.png');
      // /workspace/src/discord/assets/img/cards/profilecardDefault.png
      // logger.debug(`[${PREFIX}] tryC: ${tryC}`);
      // const tryD = path.resolve('src/discord/assets/img/cards/profilecardDefault.png');
      // /workspace/src/discord/assets/img/cards/profilecardDefault.png
      // logger.debug(`[${PREFIX}] tryD: ${tryD}`);
      // const tryE = path.resolve('./src/discord/assets/img/cards/profilecardDefault.png');
      // /workspace/src/discord/assets/img/cards/profilecardDefault.png
      // logger.debug(`[${PREFIX}] tryE: ${tryE}`);
      // Doesnt work on windows
      // Error loading background image: TypeError [ERR_INVALID_PROTOCOL]: Protocol "c:" not supported. Expected "http:"
      // const tryF = path.resolve('~/src/discord/assets/img/cards/profilecardDefault.png');
      // logger.debug(`[${PREFIX}] tryF: ${tryF}`);
      // Doesnt work on windows
      // Error loading background image: TypeError [ERR_INVALID_URL]: Invalid URL
      // const tryG = '~/src/discord/assets/img/cards/profilecardDefault.png';
      // logger.debug(`[${PREFIX}] tryG: ${tryG}`);
      // const tryH = './src/discord/assets/img/cards/profilecardDefault.png';
      // logger.debug(`[${PREFIX}] tryH: ${tryH}`);
      // Doesnt work on windows
      // Error loading background image: TypeError [ERR_INVALID_URL]: Invalid URL
      // const tryI = '../../assets/img/cards/profilecardDefault.png';
      // logger.debug(`[${PREFIX}] tryI: ${tryI}`);
      // const tryJ = '.\\src\\discord\\assets\\img\\cards\\profilecardDefault.png';
      // logger.debug(`[${PREFIX}] tryJ: ${tryJ}`);
      // const tryK = '~\\src\\discord\\assets\\img\\cards\\profilecardDefault.png';
      // logger.debug(`[${PREFIX}] tryK: ${tryK}`);
      // const tryL = './src/discord/assets/img/cards/profilecardDefault.png';
      // logger.debug(`[${PREFIX}] tryL: ${tryL}`);
      // const tryM = '~/src/discord/assets/img/cards/profilecardDefault.png';
      // logger.debug(`[${PREFIX}] tryM: ${tryM}`);

      const background = await Canvas.loadImage(coloredCard);
      // const background = await Canvas.loadImage('https://i.imgur.com/uFp3u7j.png');

      logger.debug(`[${PREFIX}] image loaded`);
      logger.debug(`[${PREFIX}] background: ${background}`);
      context.drawImage(background, 0, 0, canvas.width, canvas.height);
      logger.debug(`[${PREFIX}] image drawn`);
    } catch (err) {
      logger.error(`[${PREFIX}] Error loading background image: ${err}`);
    }

    // Username Text Resize to fit
    const applyUsername = (canvas:Canvas.Canvas, text:string) => {
      const context = canvas.getContext('2d');
      let fontSize = 50;
      do {
        context.font = `${fontSize -= 2}px futura`;
      } while (context.measureText(text).width > 435);
      return context.font;
    };

    logger.debug(`[${PREFIX}] username resize`);

    // Username Text
    context.font = applyUsername(canvas, `${target.user.tag}`);
    context.fillStyle = textColor;
    context.fillText(`${target.user.tag}`, 245, 124);
    // context.font = applyUsername(canvas, `${target.displayName}`);
    // context.fillStyle = textColor;
    // context.fillText(`${target.displayName}`, 245, 124);

    logger.debug(`[${PREFIX}] username`);

    // Get User Data
    let targetData = {} as userDbEntry;
    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_USERS}/${target.id}`);
      await ref.once('value', async (data) => {
        if (data.val() !== null && data.val() !== undefined) {
          targetData = data.val();
        }
      });
    } else {
      logger.error('Firebase not initialized!');
      targetData = userExample as userDbEntry;
    }
    // logger.debug(`[${PREFIX}] targetData: ${JSON.stringify(targetData, null, 2)}`);

    // User Info Text
    context.font = `30px futura`;
    context.textAlign = 'right';
    context.fillStyle = '#ffffff';

    if (targetData.timezone) {
      const timestring = new Date().toLocaleTimeString(
        'en-US', {
          timeZone: targetData.timezone,
          hour12: true,
          hour: 'numeric',
          minute: 'numeric',
        },
      );
      context.fillText(timestring, 446, 190);
    } else {
      context.fillText('Not set!', 446, 190);
    }

    let targetBirthday = {} as Date;
    let itIsYourBirthday = false;

    if (targetData.birthday) {
      targetBirthday = new Date(`${targetData.birthday.month}, ${targetData.birthday.day+1}, 2022`);
      logger.debug(`[${PREFIX}] targetBirthday: ${targetBirthday}`);
      logger.debug(`[${PREFIX}] targetBirthday: ${targetBirthday.toLocaleString('en-US', {month: 'short'})}`);

      const today = new Date();
      if (today.getMonth() === targetBirthday.getMonth() && today.getDay() === targetBirthday.getDay()) {
        logger.debug(`[${PREFIX}] Birthday Match!`);
        itIsYourBirthday = true;
      }
      if (targetBirthday.getDay() < 10) {
        context.fillText(`${targetBirthday.toLocaleString('en-US', {month: 'short'})} 0${targetBirthday.getDay()}`, 446, 253); ;
      } else {
        context.fillText(`${targetBirthday.toLocaleString('en-US', {month: 'short'})} ${targetBirthday.getDay()}`, 446, 253);
      }
    } else {
      context.fillText(`Not set!`, 446, 253); ;
    }

    logger.debug(`[${PREFIX}] birthday`);

    /**
     * Messages Sent Text
     * @param {number} num
     * @return {string}
     */
    function numFormatter(num:number):string {
      if (num > 999 && num < 1000000) {
        return (num/1000).toFixed(2) + 'K';
      } else if (num > 1000000) {
        return (num/1000000).toFixed(2) + 'M';
      } else {
        return num.toFixed(0);
      }
    }
    const MessagesSent = targetData.experience!.total.totalExpPoints / 20;
    const test = numFormatter(MessagesSent);
    logger.debug(`[${PREFIX}] test: ${test}`);
    context.fillText(`${test}`, 684, 253);

    if (targetData.karma) {
      if (targetData.karma.karma_received) {
        context.fillText(`${numFormatter(targetData.karma.karma_received || 0)}`, 684, 190);
      } else {
        context.fillText(`${numFormatter(targetData.karma.karma_received || 0)}`, 684, 190);
      }
    } else {
      context.fillText(`0`, 684, 190);
    }
    // Choose and Draw the Star Image
    const level = targetData.experience!.total.level;
    let starImagePath = 'https://i.imgur.com/vU1erLP.png';
    if (level < 6) {
      // starImagePath = '.\\src\\discord\\assets\\img\\badges\\VIP.png';
      starImagePath = 'https://i.imgur.com/vU1erLP.png';
    } else if (level < 10) {
      // starImagePath = '.\\src\\discord\\assets\\img\\badges\\VIPLVL5.png';
      starImagePath = 'https://i.imgur.com/DRaOnUY.png';
    } else if (level < 20) {
      // starImagePath = '.\\src\\discord\\assets\\img\\badges\\VIPLVL10.png';
      starImagePath = 'https://i.imgur.com/hBuDOvE.png';
    } else if (level < 30) {
      // starImagePath = '.\\src\\discord\\assets\\img\\badges\\VIPLVL20.png';
      starImagePath = 'https://i.imgur.com/3jfSa7x.png';
    } else if (level < 40) {
      // starImagePath = '.\\src\\discord\\assets\\img\\badges\\VIPLVL30.png';
      starImagePath = 'https://i.imgur.com/tlVnx1o.png';
    } else if (level < 50) {
      // starImagePath = '.\\src\\discord\\assets\\img\\badges\\VIPLVL40.png';
      starImagePath = 'https://i.imgur.com/zNB2rtD.png';
    } else if (level > 50) {
      // starImagePath = '.\\src\\discord\\assets\\img\\badges\\VIPLVL50.png';
      starImagePath = 'https://i.imgur.com/5ElzDZ8.png';
    }
    try {
      logger.debug(`[${PREFIX}] starImagePath: ${starImagePath}`);
      const starImage = await Canvas.loadImage(starImagePath);
      context.drawImage(starImage, 727, 61, 162, 162);
    } catch (err) {
      logger.error(`[${PREFIX}] Error loading star image: ${err}`);
    }


    // VIP Level Text Resize to fit
    const applyLevel = (canvas:Canvas.Canvas, text:string) => {
      const context = canvas.getContext('2d');
      let fontSize = 50;
      do {
        context.textAlign = 'center';
        context.font = `${fontSize -= 10}px futura`;
      } while (context.measureText(text).width > 62);
      return context.font;
    };


    // VIP Level Text
    if (targetData.experience) {
      if (targetData.experience.total) {
        context.font = applyLevel(canvas, `${targetData.experience.total.level}`);
        context.fillStyle = cardColor;
        context.fillText(`${targetData.experience.total.level}`, 807, 154);
      }
    }

    // Avatar Image
    const avatar = await Canvas.loadImage(target.user.displayAvatarURL({extension: 'jpg'}));
    context.save();
    context.beginPath();
    context.arc(128, 141, 96, 0, Math.PI * 2, true);
    context.closePath();
    context.clip();
    context.drawImage(avatar, 30, 44, 195, 195);
    context.restore();

    // Level Bar Math
    let percentageOfLevel = 0;
    if (targetData.experience) {
      const levelExpPoints = targetData.experience.total.levelExpPoints;
      const expToLevel = 5 * (level ** 2) + (50 * level) + 100;
      percentageOfLevel = (levelExpPoints / expToLevel);
      logger.debug(`[${PREFIX}] percentageOfLevel: ${percentageOfLevel}`);
    }

    // Circular Level Bar
    context.save();
    context.translate(0, 282);
    context.rotate(270 * Math.PI / 180);
    context.beginPath();
    context.lineWidth = 21;
    context.lineCap = 'round';
    context.arc(141, 807, 86, 0, Math.PI * (percentageOfLevel * 2), false);
    context.strokeStyle = textColor;
    context.stroke();
    context.restore();

    // Status Icon
    context.save();
    context.beginPath();
    context.arc(191, 211, 31, 0, Math.PI * 2, true);
    context.closePath();
    context.fillStyle = cardColor;
    context.fill();
    context.restore();
    await interaction.guild?.members.fetch({user: target.id, withPresences: true, force: true});

    let statusIcon = '';
    if (target.presence) {
      if (target.presence.status === 'online') {
        // statusIcon = `.\\src\\discord\\assets\\img\\icons\\${target.presence!.status}.png`;
        statusIcon = `https://i.imgur.com/pJZGATd.png`;
      } else if (target.presence!.status === 'idle') {
        // statusIcon = `.\\src\\discord\\assets\\img\\icons\\${target.presence!.status}.png`;
        statusIcon = 'https://i.imgur.com/3ZtlfpR.png';
      } else if (target.presence!.status === 'dnd') {
        // statusIcon = `.\\src\\discord\\assets\\img\\icons\\${target.presence!.status}.png`;
        statusIcon = 'https://i.imgur.com/2ZVC480.png';
      } else if (target.presence!.status === 'offline') {
        // statusIcon = '.\\src\\discord\\assets\\img\\icons\\offline.png';
        statusIcon = 'https://i.imgur.com/eICJIwe.png';
      } else {
        statusIcon = 'https://i.imgur.com/eICJIwe.png';
      }
    }

    try {
      const status = await Canvas.loadImage(statusIcon);
      context.drawImage(status, 160, 180, 62, 62);
    } catch (err) {
      logger.error(`[${PREFIX}] Error loading status icon: ${err}`);
    }

    // Birthday Mode
    if (itIsYourBirthday) {
      logger.debug(`[${PREFIX}] Birthday Match!`);
      context.font = '45px futura';
      context.textAlign = 'center';
      context.fillStyle = textColor;
      context.fillText('HAPPY BIRTHDAY!', 467, 55);
      // const birthdayImage = '.src\\discord\\assets\\img\\cards\\birthdayOverlay.png';
      const birthdayImage = 'https://i.imgur.com/uOkR6uf';
      const birthdayOverlay = await Canvas.loadImage(birthdayImage);
      context.drawImage(birthdayOverlay, 0, 0, 934, 282);
    }

    // Process The Entire Card and Send it to Discord
    const attachment = new AttachmentBuilder(await canvas.encode('png'), {name: 'tripsit-profile-image.png'});
    interaction.reply({files: [attachment]});

    logger.debug(`[${PREFIX}] finished!`);
  },
};
