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
import { getTotalLevel } from '../../../global/utils/experience';

const F = f(__filename);

Canvas.GlobalFonts.registerFromPath(
  path.resolve(__dirname, '../../assets/img/Futura.otf'),
  'futura',
);

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
    startLog(F, interaction);
    // Slash commands usually need to "reply" to the interaction within 3 seconds
    // We use deferreply to make this take as long as we want
    // In production this isnt needed but idk why WSL is so slow here QQ
    // Down below I changed interaction.reply to interaction.editReply,
    // since the "deferReply" technically replies to the interaction with a "tripbot is thinking" message
    await interaction.deferReply();
    const target = interaction.options.getMember('target')
      ? interaction.options.getMember('target') as GuildMember
      : interaction.member as GuildMember;

    // Get User Data from the DB. You could also just enter your own values and i can modify the DB as needed
    // Everything beyond here should be somewhat familiar, good luck =D
    const targetData = await profile(target.id);

    if (!interaction.guild) {
      interaction.reply('You can only use this command in a guild!');
      return false;
    }

    // Create Canvas and Context
    const canvasWidth = 918;
    const canvasHeight = 292;
    const canvasObj = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvasObj.getContext('2d');

    // Choose color based on user's role
    let cardLightColor = '#141414';
    let cardDarkColor = '#000000';
    let chipColor = '#000000';
    let textColor = '#ffffff';

    const colorRole = target.roles.color;
    if (colorRole) {
      if (colorRole.id === env.ROLE_PURPLE) {
        cardDarkColor = '#19151e';
        cardLightColor = '#2d2636';
        chipColor = '#47335f';
        textColor = '#b072ff';
      } else if (colorRole.id === env.ROLE_BLUE) {
        cardDarkColor = '#161d1f';
        cardLightColor = '#283438';
        chipColor = '#3a5760';
        textColor = '#5acff5';
      } else if (colorRole.id === env.ROLE_GREEN) {
        cardDarkColor = '#151a16';
        cardLightColor = '#252e28';
        chipColor = '#31543d';
        textColor = '#6de194';
      } else if (colorRole.id === env.ROLE_PINK) {
        cardDarkColor = '#1e151b';
        cardLightColor = '#352530';
        chipColor = '#5f324f';
        textColor = '#ff6dcd';
      } else if (colorRole.id === env.ROLE_RED) {
        cardDarkColor = '1f1616';
        cardLightColor = '#382727';
        chipColor = '#613838';
        textColor = '#ff5f60';
      } else if (colorRole.id === env.ROLE_ORANGE) {
        cardDarkColor = '#1d1814';
        cardLightColor = '#342b24';
        chipColor = '#5f422e';
        textColor = '#ffa45f';
      } else if (colorRole.id === env.ROLE_YELLOW) {
        cardDarkColor = '#1d1b14';
        cardLightColor = '#333024';
        chipColor = '#5e532d';
        textColor = '#ffdd5d';
      } else if (colorRole.id === env.ROLE_WHITE) {
        cardDarkColor = '#242424';
        cardLightColor = '#404040';
        chipColor = '#666666';
        textColor = '#dadada';
      } else if (colorRole.id === env.ROLE_BLACK) {
        cardDarkColor = '#0e0e0e';
        cardLightColor = '#181818';
        chipColor = '#262626';
        textColor = '#626262';
      } else if (colorRole.id === env.ROLE_DONOR_PURPLE) {
        cardDarkColor = '#1f1b25';
        cardLightColor = '#372e42';
        chipColor = '#432767';
        textColor = '#9542ff';
      } else if (colorRole.id === env.ROLE_DONOR_BLUE) {
        cardDarkColor = '#161d1f';
        cardLightColor = '#283438';
        chipColor = '#3a5760';
        textColor = '#22bef0';
      } else if (colorRole.id === env.ROLE_DONOR_GREEN) {
        cardDarkColor = '#1a211c';
        cardLightColor = '#2d3b32';
        chipColor = '#275c39';
        textColor = '#45e47b';
      } else if (colorRole.id === env.ROLE_DONOR_PINK) {
        cardDarkColor = '#261c23';
        cardLightColor = '#44303d';
        chipColor = '#682b52';
        textColor = '#ff4ac1';
      } else if (colorRole.id === env.ROLE_DONOR_RED) {
        cardDarkColor = '#241b1b';
        cardLightColor = '#412e2e';
        chipColor = '#662526';
        textColor = '#ff3c3e';
      } else if (colorRole.id === env.ROLE_DONOR_ORANGE) {
        cardDarkColor = '#241f1b';
        cardLightColor = '#41362e';
        chipColor = '#664225';
        textColor = '#ff913b';
      } else if (colorRole.id === env.ROLE_DONOR_YELLOW) {
        cardDarkColor = '#23211a';
        cardLightColor = '#3f3b2c';
        chipColor = '#655721';
        textColor = '#ffd431';
      }
    }

    // Draw the card shape and chips
    context.fillStyle = cardLightColor;
    context.beginPath();
    context.roundRect(0, 0, 675, 292, [19]);
    context.fill();
    context.fillStyle = cardLightColor;
    context.beginPath();
    context.roundRect(684, 0, 234, 292, [19]);
    context.fill();
    context.fillStyle = cardDarkColor;
    context.beginPath();
    context.roundRect(0, 0, 675, 145, [19]);
    context.fill();
    context.fillStyle = cardDarkColor;
    context.beginPath();
    context.roundRect(684, 0, 234, 206, [19]);
    context.fill();

    context.fillStyle = chipColor;
    context.beginPath();
    context.roundRect(18, 165, 201, 51, [19]);
    context.fill();
    context.fillStyle = chipColor;
    context.beginPath();
    context.roundRect(18, 225, 201, 51, [19]);
    context.fill();
    context.fillStyle = chipColor;
    context.beginPath();
    context.roundRect(237, 165, 201, 51, [19]);
    context.fill();
    context.fillStyle = chipColor;
    context.beginPath();
    context.roundRect(237, 225, 201, 51, [19]);
    context.fill();
    context.fillStyle = chipColor;
    context.beginPath();
    context.roundRect(456, 165, 201, 51, [19]);
    context.fill();
    context.fillStyle = chipColor;
    context.beginPath();
    context.roundRect(456, 225, 201, 51, [19]);
    context.fill();
    context.fillStyle = chipColor;
    context.beginPath();
    context.roundRect(702, 225, 201, 51, [19]);
    context.fill();
    context.strokeStyle = chipColor;
    context.lineWidth = 18;
    context.beginPath();
    context.arc(801, 104, 77, 0, 2 * Math.PI);
    context.stroke();

    // WIP: Purchased Background
    const Background = await Canvas.loadImage('https://i.gyazo.com/adfbab1d3fdeadef74ec18ce6efe869c.png');
    context.save();
    context.globalCompositeOperation = 'lighten';
    context.globalAlpha = 0.03;
    context.beginPath();
    context.roundRect(9, 9, 657, 274, [10]);
    context.roundRect(693, 9, 216, 274, [10]);
    context.clip();
    context.drawImage(Background, 0, 0);
    context.restore();

    // Load Icon Images
    const Icons = await Canvas.loadImage('https://i.gyazo.com/6669a36a7adf68996354bd7586cd7083.png');
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
    // await interaction.guild.members.fetch({ user: target.id, withPresences: true, force: true });

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
    context.fillText(`${target.displayName}`, 146, 90);

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
      context.fillText(timestring, 210, 201);
    } else {
      context.fillText('NOT SET!', 210, 201);
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
        context.fillText(`${targetBirthday.toLocaleString('en-GB', { month: 'short' })} 0${targetBirthday.getDate()}`, 205, 260);
      } else {
        context.fillText(`${targetBirthday.toLocaleString('en-GB', { month: 'short' })} ${targetBirthday.getDate()}`, 205, 260);
      }
    } else {
      context.fillText('NOT SET!', 210, 260);
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
    const totalData = await getTotalLevel(targetData.totalExp);
    if (targetData.totalExp) {
      const MessagesSent = targetData.totalExp / 20;
      context.fillText(`${numFormatter(MessagesSent)}`, 429, 201);
    }

    // WIP: Voice Hours Text
    context.fillText('WIP!', 429, 260);

    // Karma Text
    context.fillText(`${numFormatter(targetData.karma_received)}`, 648, 201);

    // WIP: Tokens Text
    context.fillText('WIP!', 648, 260);

    // Level Text
    context.fillText(`${totalData.level}`, 894, 260);

    // Choose and Draw the Star Image
    let LevelImagePath = 'https://i.gyazo.com/13daebdda4ca75ab59923396f255f7db.png';

    if (totalData.level < 10) {
      LevelImagePath = 'https://i.gyazo.com/13daebdda4ca75ab59923396f255f7db.png';
    } else if (totalData.level < 20) {
      LevelImagePath = 'https://i.gyazo.com/5d37a2d3193c4c7e8a033b6b2ed7cb7f.png';
    } else if (totalData.level < 30) {
      LevelImagePath = 'https://i.gyazo.com/161506f23b1907ac1280db26ead5a0a4.png';
    } else if (totalData.level < 40) {
      LevelImagePath = 'https://i.gyazo.com/4bd15a019f7fd5c881e196c38a8b8bf5.png';
    } else if (totalData.level < 50) {
      LevelImagePath = 'https://i.gyazo.com/ca0b1aca00a71a992c196ca0498efef3.png';
    } else if (totalData.level < 60) {
      LevelImagePath = 'https://i.gyazo.com/f614a14051dbc1366ce4de2ead98a519.png';
    } else if (totalData.level < 70) {
      LevelImagePath = 'https://i.gyazo.com/3844d103c034f16e781fd947f593895c.png';
    } else if (totalData.level < 80) {
      LevelImagePath = 'https://i.gyazo.com/0357a63887c1183d53827eb8ebb29ee3.png';
    } else if (totalData.level < 90) {
      LevelImagePath = 'https://i.gyazo.com/693948d030989ffa5bf5e381f471bac6.png';
    } else if (totalData.level < 100) {
      LevelImagePath = 'https://i.gyazo.com/eed9e28789262927cefe0a68b3126ed2.png';
    } else if (totalData.level >= 100) {
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
    percentageOfLevel = (totalData.levelPoints / totalData.expToLevel);
    log.debug(F, `percentageOfLevel: ${percentageOfLevel}`);

    // Circular Level Bar
    context.beginPath();
    context.lineWidth = 18;
    context.lineCap = 'round';
    context.arc(801, 104, 77, 1.5 * Math.PI, (0.70 * 1.4999) * Math.PI, false);
    context.strokeStyle = textColor;
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
    // if (itIsYourBirthday) {
    // log.debug(F, `Birthday Match!`);
    // context.font = '45px futura';
    // context.textAlign = 'center';
    // context.fillStyle = textColor;
    // context.fillText('HAPPY BIRTHDAY!', 467, 55);
    // const birthdayImage = '.src\\discord\\assets\\img\\cards\\birthdayOverlay.png';
    // const birthdayImage = 'https://i.imgur.com/uOkR6uf.png';
    // const birthdayOverlay = await Canvas.loadImage(birthdayImage);
    // context.drawImage(birthdayOverlay, 0, 0, 934, 282);
    // }

    // Process The Entire Card and Send it to Discord
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), { name: 'tripsit-profile-image.png' });
    interaction.editReply({ files: [attachment] });
    return true;
  },
};
