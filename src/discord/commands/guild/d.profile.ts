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
import env from '../../../global/utils/env.config';
import logger from '../../../global/utils/logger';
import Canvas from '@napi-rs/canvas';
import * as path from 'path';

const PREFIX = path.parse(__filename).name;

// Pass the entire Canvas object because you'll need access to its width and context
const applyText = (canvas:Canvas.Canvas, text:string) => {
  const context = canvas.getContext('2d');

  // Declare a base size of the font
  let fontSize = 70;

  do {
    // Assign the font to the context and decrement it so it can be measured again
    context.font = `${fontSize -= 10}px`;
    // Compare pixel width of the text to the canvas minus the approximate avatar size
  } while (context.measureText(text).width > canvas.width - 300);

  // Return the result to use in the actual canvas
  return context.font;
};

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

    if (!target) {
      const embed = embedTemplate()
          .setColor(Colors.Red)
          .setDescription('Target not found?');
      interaction.reply({embeds: [embed], ephemeral: true});
      logger.debug(`[${PREFIX}] Target not found!`);
      return;
    }

    // Create a 700x250 pixel canvas and get its context
    // The context will be used to modify the canvas
    const canvasWidth = 700;
    const canvasHeight = 250;
    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
    const context = canvas.getContext('2d');
    let y = 65;
    const x = 15;

    // Get background image
    // const background = await Canvas.loadImage('./src/discord/assets/img/wallpaper.png');
    const background = await Canvas.loadImage('https://i.imgur.com/uFp3u7j.png');

    // This uses the canvas dimensions to stretch the image onto the entire canvas
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Set the color of the stroke
    context.strokeStyle = '#0099ff';
    // Draw a rectangle with the dimensions of the entire canvas
    context.strokeRect(0, 0, canvas.width, canvas.height);

    // Select the font size and type from one of the natively available fonts
    context.font = applyText(canvas, `${(interaction.member! as GuildMember).displayName}!`);
    // Select the style that will be used to fill the text in
    context.fillStyle = '#ffffff';
    // Actually fill the text with a solid color
    context.fillText(`${(interaction.member! as GuildMember).displayName}'s profile!`, x, y);


    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_USERS}/${target.id}`);
      await ref.once('value', async (data) => {
        let targetData = {} as userDbEntry;
        if (data.val() !== null && data.val() !== undefined) {
          targetData = data.val();
          logger.debug(`[${PREFIX}] targetData: ${JSON.stringify(targetData, null, 2)}`);
          context.font = `25px`;

          if (targetData.karma) {
            if (targetData.karma.karma_given) {
              context.fillText(`Karma Given: ${targetData.karma.karma_given || 0}`, x, y+=80);
            }
            if (targetData.karma.karma_received) {
              context.fillText(`Karma Received: ${targetData.karma.karma_received || 0}`, canvas.width/2, y);
            }
          }

          if (targetData.experience) {
            if (targetData.experience.general) {
              context.fillText(`General LV: ${targetData.experience.general.level}`, x, y+=30);
            }
            if (targetData.experience.tripsitter) {
              context.fillText(`Tripsitter LV: ${targetData.experience.tripsitter.level}`, canvas.width/2, y);
            }
            if (targetData.experience.developer) {
              context.fillText(`Tripsitter LV: ${targetData.experience.developer.level}`, canvas.width/2, y);
            }
          }

          context.fillText(`Timezone: ${targetData.timezone !== undefined ? targetData.timezone : 'Use /timezone!'}`, x, y+=30);
          context.fillText(`Birthday: ${targetData.birthday !== undefined ? `${targetData.birthday.month} ${targetData.birthday.day}` : 'Use /birthday!'}`, canvas.width/2, y);

          context.fillText(`Created: ${target.user.createdAt.toDateString()}`, x, y+=30);
          context.fillText(`Joined: ${target.joinedAt?.toDateString()}`, canvas.width/2, y);
        }
      });
    }

    // Define avatar image
    const avatar = await Canvas.loadImage(interaction.user.displayAvatarURL({extension: 'jpg'}));
    // Pick up the pen
    context.beginPath();
    // Start the arc to form a circle
    context.arc(canvasWidth-65, 65, 50, 0, Math.PI * 2, true);
    // Put the pen down
    context.closePath();
    // Clip off the region you drew on
    context.clip();
    // // Draw a shape onto the main canvas
    context.drawImage(avatar, canvasWidth-115, 15, 100, 100);

    // Use the helpful Attachment class structure to process the file for you
    const attachment = new AttachmentBuilder(await canvas.encode('png'), {name: 'profile-image.png'});
    interaction.reply({files: [attachment]});

    logger.debug(`[${PREFIX}] finished!`);
  },
};
