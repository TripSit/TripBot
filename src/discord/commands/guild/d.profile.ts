/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  UserContextMenuCommandInteraction,
  Colors,
  GuildMember,
  AttachmentBuilder,
} from 'discord.js';
import {userDbEntry} from '../../../global/@types/database';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {userExample} from '../../../global/utils/exampleUser';
import timezones from '../../../global/assets/data/timezones.json';
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import Canvas from '@napi-rs/canvas';
import moment from 'moment';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

Canvas.GlobalFonts.registerFromPath(
    path.join(__dirname, '../../assets/img/Futura.otf'),
    'futura',
);

export const profile: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('profile')
      .setDescription('Return the user\'s profile!')
      .addUserOption((option) => option
          .setName('target')
          .setDescription('User to get info on!')
          .setRequired(true)),
  async execute(
      interaction:ChatInputCommandInteraction | UserContextMenuCommandInteraction) {
    const target = interaction.options.getMember('target')! as GuildMember;

    if (!interaction.guild) {
      interaction.reply('You can only use this command in a guild!');
      return;
    }

    // let targetFromIrc = options ? false : null;
    // let targetFromDiscord = options ? true : null;
    // let targetIsMember = options ? true : null;

    // Determine target information
    // if (typeof target !== 'object') {
    //   if (target.startsWith('<@') && target.endsWith('>')) {
    //     // If the target string starts with a < then it's likely a discord user
    //     // targetFromIrc = false;
    //     // targetFromDiscord = true;
    //     // targetIsMember = true;
    //     const targetId = target.slice(3, -1);
    //     logger.debug(`[${PREFIX}] targetId: ${targetId}`);
    //     try {
    //       target = await interaction.guild.members.fetch(target.id);
    //     } catch (err) {
    //       logger.error(err);
    //       interaction.reply('Could not find that user!');
    //       return;
    //     }
    //   }
    // else {
    //   // Do a whois lookup to the user
    //   let data = null;
    //   await global.ircClient.whois(target, async (resp) => {
    //     data = resp;
    //   });

    //   // This is a hack substanc3 helped create to get around the fact that the whois command
    //   // is asyncronous by default, so we need to make this syncronous
    //   while (data === null) {
    //     await new Promise(resolve => setTimeout(resolve, 100)); // eslint-disable-line
    //   }
    //   // logger.debug(`[${PREFIX}] data ${JSON.stringify(data, null, 2)}`);
    //   if (!data.host) {
    //     const embed = embedTemplate();
    //     logger.debug(`[${PREFIX}] ${target} not found on IRC`);
    //     embed.setDescription(stripIndents`${target} is not found on IRC, did you spell that right?`);
    //     interaction.reply({embeds: [embed], ephemeral: true});
    //     return;
    //   }
    //   // targetFromIrc = true;
    //   // targetFromDiscord = false;
    //   // targetIsMember = false;
    //   target = data;
    // }
    // }

    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    // Error Message
    if (!target) {
      const embed = embedTemplate()
          .setColor(Colors.Red)
          .setDescription('Target not found?');
      interaction.reply({embeds: [embed], ephemeral: true});
      logger.debug(`[${PREFIX}] Target not found!`);
      return;
    }

    // Choose colour based on user's role

    let ColoredCard = 'src/discord/assets/img/profilecardDefault.png';
    let CardColor = '#141414';
    let TextColor = '#ffffff';
    
    const ColorRole = target.roles.color;

    if (ColorRole) {
      logger.debug(`[${PREFIX}] ColorRole: ${ColorRole.id}`);
      if (ColorRole.id === env.ROLE_PURPLE)  {
        ColoredCard = 'src/discord/assets/img/profilecardPurple.png';
        CardColor = '#2d2636';
        // var ChipColor = '#FFC0CB';
        TextColor = '#b072ff';
      } else if (ColorRole.id === env.ROLE_BLUE) {
        ColoredCard = 'src/discord/assets/img/profilecardBlue.png';
        CardColor = '#283438';
        // var ChipColor = '#FFA500';
        TextColor = '#5acff5';
      } else if (ColorRole.id === env.ROLE_GREEN) {
        ColoredCard = 'src/discord/assets/img/profilecardGreen.png';
        CardColor = '#252e28';
        // var ChipColor = '#00FF00';
        TextColor = '#6de194';
      } else if (ColorRole.id === env.ROLE_PINK) {
        ColoredCard = 'src/discord/assets/img/profilecardPink.png';
        CardColor = '#352530';
        // var ChipColor = '#FF0000';
        TextColor = '#ff6dcd';
      } else if (ColorRole.id === env.ROLE_RED) {
        ColoredCard = 'src/discord/assets/img/profilecardRed.png';
        CardColor = '#382727';
        // var ChipColor = '#FF0000';
        TextColor = '#ff5f60';
      } else if (ColorRole.id === env.ROLE_ORANGE) {
        ColoredCard = 'src/discord/assets/img/profilecardOrange.png';
        CardColor = '#342b24';
        // var ChipColor = '#FFA500';
        TextColor = '#ffa45f';
      } else if (ColorRole.id === env.ROLE_YELLOW) {
        ColoredCard = 'src/discord/assets/img/profilecardYellow.png';
        CardColor = '#333024';
        // var ChipColor = '#FFFF00';
        TextColor = '#ffdd5d';
      } else if (ColorRole.id === env.ROLE_WHITE) {
        ColoredCard = 'src/discord/assets/img/profilecardWhite.png';
        CardColor = '#404040';
        // var ChipColor = '#FFFFFF';
        TextColor = '#ffffff';
      } else if (ColorRole.id === env.ROLE_BLACK) {
        ColoredCard = 'src/discord/assets/img/profilecardBlack.png';
        CardColor = '#181818';
        // var ChipColor = '#000000';
        TextColor = '#626262';
      }
    }

    logger.debug(`[${PREFIX}] CardColor: ${CardColor} | TextColor: ${TextColor} | ColoredCard: ${ColoredCard}`);

    // Create Canvas and Context
    const canvasWidth = 934;
    const canvasHeight = 282;
    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvas.getContext('2d');

    // Backround Image
    const background = await Canvas.loadImage(ColoredCard);
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Username Text Resize to fit
    const applyUsername = (canvas:Canvas.Canvas, text:string) => {
      const context = canvas.getContext('2d');
      let fontSize = 50;
      do {
        context.font = `${fontSize -= 2}px futura`;
      } while (context.measureText(text).width > 435);
      return context.font;
    };

    // Username Text
    context.font = applyUsername(canvas, `${target.user.tag}`);
    context.fillStyle = TextColor;
    context.fillText(`${target.user.tag}`, 245, 124);

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

    let gmtValue = '';
    let now = new Date();
    if (targetData.timezone) {
      now = moment(Date.now()).tz(targetData.timezone);
      const fmt = now?.toLocaleDateString('en-US', {timeZoneName: 'short'});
      context.fillText(`${targetData.timezone !== undefined ? `${now.format('HH:mm A')}` : 'Not set!'}`, 446, 190);

    }
    // for (let i = 0; i < timezones.length; i += 1) {
    //   if (timezones[i].tzCode === targetData.timezone) {
    //     // gmtValue = timezones[i].offset;
    //     // Get current time from timezone
    //     const now = moment().tz(targetData.timezone);
    //     const time = now.format('HH:mm A'); // idk if we would want 24-hour or 12-hour time
    //     // Pull in the first three character (the hour offset)
        
    //     gmtValue = gmtValue.slice(0, 3);
    //   }
    // }
    context.fillText(`${targetData.timezone !== undefined ? `${now.format('HH:mm A')}` : 'Not set!'}`, 446, 190);

    if (targetData.birthday) {
      if (targetData.birthday.day < 10) {
        context.fillText(`${targetData.birthday.month}-0${targetData.birthday.day}`, 440, 253); ;
      } else {
        context.fillText(`${targetData.birthday.month}-${targetData.birthday.day}`, 440, 253);
      }
    } else {
      context.fillText(`Not set!`, 440, 253); ;
    }

    // Messages Sent Text
    function numFormatter(num:number) {
      if (num > 999 && num < 1000000) {
        return (num/1000).toFixed(2) + 'K';
      } else if (num > 1000000) {
        return (num/1000000).toFixed(2) + 'M';
      } else if (num < 900) {
        return num;
      }
    }
    const MessagesSent = targetData.experience!.total.totalExpPoints / 20;
    context.fillText(`${numFormatter(MessagesSent)}`, 684, 253);

    if (targetData.karma) {
      if (targetData.karma.karma_received) {
        context.fillText(`${numFormatter(targetData.karma.karma_received || 0)}`, 684, 190);
      }
    } else {
      context.fillText(`0`, 684, 190);
    }

    // Choose and Draw the Star Image
    const level = targetData.experience!.total.level;
    let starImagePath = 'src/discord/assets/img';
    if (level < 6) {
      starImagePath += '/VIP.png';
    } else if (level < 10) {
      starImagePath += '/VIPLVL5.png';
    } else if (level < 20) {
      starImagePath += '/VIPLVL10.png';
    } else if (level < 30) {
      starImagePath += '/VIPLVL20.png';
    } else if (level < 40) {
      starImagePath += '/VIPLVL30.png';
    } else if (level < 50) {
      starImagePath += '/VIPLVL40.png';
    } else if (level > 50) {
      starImagePath += '/VIPLVL50.png';
    }
    const starImage = await Canvas.loadImage(starImagePath);
    context.drawImage(starImage, 727, 61, 162, 162);

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
        context.fillStyle = CardColor;
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
    const levelExpPoints = targetData.experience!.total!.totalExpPoints;
    const expToLevel = 5 * (level ** 2) + (50 * level) + 100;
    const percentageOfLevel = (levelExpPoints / expToLevel) / 100;
    logger.debug(`[${PREFIX}] percentageOfLevel: ${percentageOfLevel}`);

    // Circular Level Bar
    context.save();
    context.translate(0, 282);
    context.rotate(270 * Math.PI / 180);
    context.beginPath();
    context.lineWidth = 21;
    context.lineCap = 'round';
    context.arc(141, 807, 86, 0, Math.PI * (percentageOfLevel * 2), false);
    context.strokeStyle = TextColor;
    context.stroke();
    context.restore();

    // Status Icon
    context.save();
    context.beginPath();
    context.arc(191, 211, 31, 0, Math.PI * 2, true);
    context.closePath();
    context.fillStyle = CardColor;
    context.fill();
    context.restore();
    await interaction.guild?.members.fetch({user: target.id, withPresences: true, force: true});

    if (target.presence?.status === undefined) {
      const statusIcon = await Canvas.loadImage(`src/discord/assets/img/offline.png`);
      context.drawImage(statusIcon, 160, 180, 62, 62);
    } else {
      const statusIcon = await Canvas.loadImage(`src/discord/assets/img/${target.presence!.status}.png`);
      context.drawImage(statusIcon, 160, 180, 62, 62);
    }

    // Birthday Mode

    if (targetData.birthday) {
      const birthday = new Date(`${targetData.birthday!.month}, ${targetData.birthday!.day+1}, 2022`);
      const today = new Date();

      if (today.getMonth() === birthday.getMonth() && today.getDay() === birthday.getDay()) {
        logger.debug(`[${PREFIX}] Birthday Match!`);
        context.font = '45px futura';
        context.textAlign = 'center';
        context.fillStyle = TextColor;
        context.fillText('HAPPY BIRTHDAY!', 467, 55);
        const birthdayOverlay = await Canvas.loadImage('src/discord/assets/img/birthdayOverlay.png');
        context.drawImage(birthdayOverlay, 0, 0, 934, 282);
      }
    }

    // Process The Entire Card and Send it to Discord
    const attachment = new AttachmentBuilder(await canvas.encode('png'), {name: 'tripsit-profile-image.png'});
    interaction.reply({files: [attachment]});

    logger.debug(`[${PREFIX}] finished!`);
  },
};
