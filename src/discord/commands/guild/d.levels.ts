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
import { getPersonaInfo } from '../../../global/commands/g.rpg';
import { inventoryGet } from '../../../global/utils/knex';
import { imageGet } from '../../utils/imageGet';
// import { expForNextLevel, getTotalLevel } from '../../../global/utils/experience';
// import { inventoryGet } from '../../../global/utils/knex';
// import { imageGet } from '../../utils/imageGet';

// import { getTotalLevel } from '../../../global/utils/experience';

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

export default dLevels;

export const dLevels: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('levels')
    .setDescription('Get someone\'s current experience levels!')
    .addUserOption(option => option
      .setName('user')
      .setDescription('User to lookup')),
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

    const targetData = await levels(target.id);
    log.debug(F, `targetData: ${JSON.stringify(targetData, null, 2)}`);
    log.debug(F, `${(interaction.member as GuildMember).displayName} is Tripsitter level ${targetData.text.GENERAL.level} and is ${(targetData.text.GENERAL.exp / targetData.text.GENERAL.nextLevel) * 100}% to level ${targetData.text.GENERAL.level + 1}`); // eslint-disable-line max-len
    let layoutHeight = 386;
    let layout = 1;
    if ((interaction.member as GuildMember).roles.cache.has(env.ROLE_TEAMTRIPSIT)) {
      layoutHeight = 566;
      layout = 4;
      log.debug(F, 'is teamtripsit');
    } else if ((interaction.member as GuildMember).roles.cache.has(env.ROLE_CONTRIBUTOR)) {
      layoutHeight = 506;
      layout = 3;
      log.debug(F, 'is contributor');
    } else if ((interaction.member as GuildMember).roles.cache.has(env.ROLE_HELPER)) {
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
    context.arc(612, 73, 54, 0, Math.PI * 2, true);
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
        context.roundRect(20, 0, 901, 145, [19]);
        context.roundRect(20, 154, 901, (layoutHeight - 154), [19]);
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

    try {
      const StatusIcon = await Canvas.loadImage(StatusIconPath);
      context.drawImage(StatusIcon, 88, 92);
    } catch (err) {
      log.error(F, `Error loading status icon: ${err}`);
    }

    // WIP: Camp Icon
    const CampIconPath = 'https://i.gyazo.com/62a9db6c42ca3c03cc892b28f5d8b367.png';
    const CampIcon = await Canvas.loadImage(CampIconPath);
    context.drawImage(CampIcon, 556, 17);

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

    // Progress Bars
    context.fillStyle = textColor;
    context.beginPath();
    context.roundRect(87, 172, (targetData.text.total.exp / targetData.text.total.nextLevel) * 579, 76, [19]);
    context.roundRect(87, 257, (targetData.text.GENERAL.exp / targetData.text.GENERAL.nextLevel) * 579, 51, [19]);
    context.roundRect(87, 317, (targetData.text.voice.exp / targetData.text.voice.nextLevel) * 579, 51, [19]);
    if (layout > 1) {
      context.roundRect(87, 377, (targetData.text.TRIPSITTER.exp / targetData.text.TRIPSITTER.nextLevel), 51, [19]);
    }
    if (layout > 2) {
      context.roundRect(87, 437, (targetData.text.DEVELOPER.exp / targetData.text.DEVELOPER.nextLevel), 51, [19]);
    }
    if (layout > 3) {
      context.roundRect(87, 497, (targetData.text.TEAM.exp / targetData.text.TEAM.nextLevel), 51, [19]);
    }
    context.fill();

    // Bar Labels
    context.font = '25px futura';
    context.fillStyle = '#ffffff';
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.save();
    context.translate(921, 0);
    context.rotate((90 * Math.PI) / 180);
    context.fillText('RANK', ((layoutHeight / 2) + 77), 45);
    context.translate(layoutHeight, 921);
    context.rotate((180 * Math.PI) / 180);
    context.fillText('LEVEL', ((layoutHeight / 2) - 77), 45);
    context.restore();

    // Number Formatter
    // function numFormatter(num:number):string {
    //   if (num > 999 && num < 1000000) {
    //     return `${(num / 1000).toFixed(2)}K`;
    //   }
    //   if (num > 1000000) {
    //     return `${(num / 1000000).toFixed(2)}M`;
    //   }
    //   return num.toFixed(0);
    // }

    /**  Messages Sent Text
    context.textAlign = 'right';
    if (targetData.totalTextExp) {
      const MessagesSent = targetData.totalTextExp / 20;
      context.fillText(`${numFormatter(MessagesSent)}`, 894, 45);
    } else {
      context.fillText('0', 894, 45);
    }

    // Voice Hours Text
    if (targetData.totalTextExp) {
      const minsInChat = (targetData.totalVoiceExp / 10) / 2;
      context.fillText(`${numFormatter(minsInChat)}`, 894, 105);
    } else {
      context.fillText('0', 894, 105);
    }
    */
    // Icon Images
    // Set a clip to prevent icons from being drawn outside of the card
    context.save();
    context.beginPath();
    context.roundRect(0, 0, 921, (layoutHeight - 18), [19]);
    context.clip();
    // Load Icon Images
    const Icons = await Canvas.loadImage('https://i.gyazo.com/69d030886df6d0d260e2a293a6bc7894.png');
    // const Icons = await Canvas.loadImage(path.join(__dirname, '..', '..', 'assets', 'img', 'cards', 'icons.png'));
    context.drawImage(Icons, 0, 0);
    context.restore();
    // Choose and Draw the Level Image
    const LevelImagePath = 'https://i.gyazo.com/f614a14051dbc1366ce4de2ead98a519.png';
    try {
      // log.debug(F, `LevelImagePath: ${LevelImagePath}`);
      const LevelImage = await Canvas.loadImage(LevelImagePath);
      context.drawImage(LevelImage, 97, 181, 58, 58);
    } catch (err) {
      log.error(F, `Error loading star image: ${err}`);
    }

    // Process The Entire Card and Send it to Discord
    const attachment = new AttachmentBuilder(await canvasObj.encode('png'), { name: 'tripsit-levels-image.png' });
    interaction.editReply({ files: [attachment] });
    return true;
  },
};
