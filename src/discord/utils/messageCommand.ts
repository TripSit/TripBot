/* eslint-disable max-len */

import {
  // ChannelType,
  Message,
  // GuildTextBasedChannel,
  Role,
  PermissionResolvable,
  // ThreadChannel,
  EmbedBuilder,
  // TextChannel,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { sleep } from '../commands/guild/d.bottest';
import { chat } from '../commands/guild/d.ai';

// import log from '../../global/utils/log';
// import {parse} from 'path';
const F = f(__filename); // eslint-disable-line

const helpCounter = new Map<string, number>();

export default messageCommand;

const sadStuff = [
  'sadface',
  ':(',
  ':c',
  ':<',
  ':[',
  '=(',
  '=c',
  '=[',
  '=<',
  '😦',
  '😢',
  '😭',
  '😞',
  '😔',
  '😕',
  '😟',
  '😣',
  '😖',
  '😫',
  '😩',
  '😤',
  '😠',
  '😡',
  '😶',
  '😐',
  '😑',
];

const heartEmojis = [
  '❤', '🧡', '💛', '💚', '💙', '💜', '💝', '💖', '💗', '💘', '💕', '💞', '💓', '💟', '❣', '🫂',
];

async function isSadMessage(message:Message):Promise<boolean> {
  return sadStuff.some(word => (message.cleanContent.includes(word)
  && !(message.cleanContent.substring(message.cleanContent.indexOf(':') + 1).includes(':'))));
}

async function isIrcCommand(message:Message):Promise<boolean> {
  return message.cleanContent.startsWith('~');
}

async function isPokingTripbot(message:Message):Promise<boolean> {
  return message.content.startsWith(`_pokes <@${env.DISCORD_CLIENT_ID}>_`);
}

async function isMentioningTripbot(message:Message):Promise<boolean> {
  return message.mentions.has(env.DISCORD_CLIENT_ID)
  || message.content.toLowerCase().includes('tripbot');
}

async function isUploadMessage(message:Message):Promise<boolean> {
  return message.content.toLowerCase().includes('upload')
    || message.content.toLowerCase().includes('steal')
    || message.content.toLowerCase().includes('fetch');
}

async function isAiEnabledGuild(message:Message):Promise<boolean> {
  // log.debug(F, `message.guild?.id: ${message.guild?.id}`);
  return message.guild?.id === env.DISCORD_GUILD_ID;
}

async function isBotOwner(message:Message):Promise<boolean> {
  return message.author.id === env.DISCORD_OWNER_ID;
}

/**
 * Message Command
 * @param {Message} message The message that was sent
 * @return {Promise<void>}
* */
export async function messageCommand(message: Message): Promise<void> {
  if (!message.guild) return; // If not in a guild then ignore all messages
  // if (message.guild.id !== env.DISCORD_GUILD_ID) return; // If not in tripsit ignore all messages
  const displayName = message.member ? message.member.displayName : message.author.username;
  // log.debug(F, `message.reference: ${JSON.stringify(message.content, null, 2)}`);

  // Ignore messages that start with ~~, these are usually strikethrough messages
  if (message.content.startsWith('~~')) { return; }

  if (await isIrcCommand(message)) {
    // If you try to use the old tripbot command prefix while inside of the tripsit guild
    if (message.guild.id !== env.DISCORD_GUILD_ID) return;

    // This doesn't work cuz webchat users are bots
    // if (message.author.bot) return;
    // Find the word that appears after ~
    const command = message.content.split(' ')[0].slice(1);
    // log.debug(F, `command: ${command}`);
    if (command === 'tripsit') {
      const now = Date.now().valueOf();
      if (helpCounter.has(message.author.id)) {
        const lastTime = helpCounter.get(message.author.id);
        if (!lastTime) {
          // log.debug(F, `lastTime is undefined!`);
          return;
        }
        if (now - lastTime < 1000 * 60 * 5) {
          await message.channel.send(stripIndents`Hey ${displayName}, you just used that command, \
give people a chance to answer 😄 If no one answers in 5 minutes you can try again.`);
          return;
        }
      }
      const roleTripsitter = await message.guild.roles.fetch(env.ROLE_TRIPSITTER) as Role;
      const roleHelper = await message.guild.roles.fetch(env.ROLE_HELPER) as Role;
      await message.channel.send(`Hey ${displayName}, someone from the ${roleTripsitter} and/or ${roleHelper} team will be with you as soon as they're available!

        If you’re in the right mindset please start by telling us what you took, at what dose and route, how long ago, along with any concerns you may have.

        **If this is a medical emergency** please contact your local emergency services: we do not call EMS on behalf of anyone.

      `);

      const embed = new EmbedBuilder()
        .setTitle('Other Resources')
        .setDescription(`**Not in an emergency, but still want to talk to a mental health advisor?**
        The [Warm line directory](https://warmline.org/warmdir.html#directory) provides non-crisis mental health support and guidance from trained volunteers.

        **Want to text or voice chat with someone?**
        The wonderful people at the [Fireside Project](https://firesideproject.org) can also help you through a rough trip.
        
        **Need LGBT support?**
        The [LGBT Hotline](https://www.lgbthotline.org) and [The Trevor Project](https://www.thetrevorproject.org/) are great resources.
        
        **Check the pins and use </crisis:1088811157185372180> for other info!!**`);

      await message.channel.send({
        embeds: [embed],
      });
      // Update helpCounter with the current date that the user sent this command
      helpCounter.set(message.author.id, Date.now().valueOf());
    } else {
      await message.channel.send(`Hey ${displayName}, use /help to get a list of commands on discord!`);
    }
  } else if (await isPokingTripbot(message)) {
    // If you poke tripbot
    const faces = [
      '( ͡° ͜ʖ ͡°)',
      'uwu',
      '😯',
      '😳',
      '😘',
      '🫣',
      '🤨',
    ];
    await message.channel.send(faces[Math.floor(Math.random() * faces.length)]);
  } else if (await isMentioningTripbot(message)) {
    // If the bot was mentioned
    // log.debug(F, `Bot was mentioned in ${message.guild.name}!`); // eslint-disable-line

    if (await isBotOwner(message) && message.content.toLowerCase().includes('phoenix')) {
      const phoenixMessage = await message.channel.send('Phoenix protocol initiated... ');
      await sleep(1000);
      await phoenixMessage.edit('Phoenix protocol initiated... 35%');
      await sleep(1000);
      await phoenixMessage.edit('Phoenix protocol initiated... 68%');
      await sleep(1000);
      await phoenixMessage.edit(`Phoenix protocol deployed. Good luck ${message.member?.displayName} <3`);
      await sleep(3000);
      await phoenixMessage.delete();
      await message.delete();
      return;
    }

    if (await isUploadMessage(message)) {
      if (message.content.toLowerCase().includes('emoji')) {
        // Check if the user has the ManageEmojis permission
        if (!message.member?.permissions.has('ManageEmojisAndStickers' as PermissionResolvable)) {
          await message.channel.send(stripIndents`Hey ${displayName}, you don't have the permission to upload emojis to this guild!`); // eslint-disable-line
          return;
        }

        // Upload all the emojis in the message to the guild
        let emojis = message.content.match(/<a?:\w+:\d+>/g);

        if (!emojis && message.reference && message.reference.messageId) {
          // try to get emojis from the message reference
          const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
          emojis = referencedMessage.content.match(/<a?:\w+:\d+>/g);
        }

        if (emojis) {
          const replyMessage = await message.channel.send(stripIndents`Hey ${displayName}, uploading emojis...`); // eslint-disable-line
          const emojiSuccessList = [];
          const emojiFailList = [];
          for (const emoji of emojis) { // eslint-disable-line
            log.debug(F, `emoji: ${emoji}`);
            const emojiId = emoji.split(':')[2].slice(0, -1);
            log.debug(F, `emojiId: ${emojiId}`);
            const emojiName = emoji.split(':')[1];
            log.debug(F, `emojiName: ${emojiName}`);
            const emojiAnimated = emoji.startsWith('<a:');
            log.debug(F, `emojiAnimated: ${emojiAnimated}`);
            const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${emojiAnimated ? 'gif' : 'png'}`;
            log.debug(F, `emojiUrl: ${emojiUrl}`);
            try {
              const emojiData = await message.guild.emojis.create({name: emojiName, attachment: emojiUrl}); // eslint-disable-line

              emojiSuccessList.push(`<${emojiAnimated ? 'a' : ''}:${emojiData.name}:${emojiData.id}>`);
            } catch (e) {
              log.error(F, `Error creating emoji: ${e}`);
              emojiFailList.push(emoji);
            }
            // So we don't hit limits by doing this too often
            sleep(1000);
          }
          const failedString = emojiFailList.length > 0
            ? `\nFailed to upload ${emojiFailList.join(' ')} to ${message.guild.name}!`
            : '';
          await replyMessage.edit(stripIndents`Uploaded ${emojiSuccessList.join(' ')} to ${message.guild.name}!${failedString}`); // eslint-disable-line
        }
      }
      if (message.content.toLowerCase().includes('sticker')) {
        // Check if the user has the ManageEmojis permission
        if (!message.member?.permissions.has('ManageEmojisAndStickers' as PermissionResolvable)) {
          await message.channel.send(stripIndents`Hey ${displayName}, you don't have the permission to upload stickers to this guild!`); // eslint-disable-line
          return;
        }
        await message.channel.send(stripIndents`Hey ${displayName}, uploading emojis...`); // eslint-disable-line

        log.debug(F, `message.stickers: ${JSON.stringify(message.stickers, null, 2)}`);
        // Upload all the stickers in the message to the guild
        const stickers = message.content.match(/<a?:\w+:\d+>/g);
        log.debug(F, `stickers: ${stickers}`);
        if (message.stickers) {
          const stickerList = [];
          for (const sticker of message.stickers.values()) { // eslint-disable-line
            log.debug(F, `sticker: ${JSON.stringify(sticker, null, 2)}`);
            const stickerData = await message.guild.stickers.create({name: sticker.name, file: sticker.url, tags: 'grinning'}); // eslint-disable-line
            stickerList.push(sticker.name);
          }
          log.debug(F, `stickerList: ${stickerList}`);
          log.debug(F, `stickerList: ${stickerList.join(' ')}`);

          await message.channel.send(`Uploaded ${stickerList.join(' ')} to ${message.guild.name}!`); // eslint-disable-line
        }
      }
    } else if (await isAiEnabledGuild(message)) {
      // log.debug(F, 'AI enabled guild detected');
      // Get the last 5 messages in the channel
      const messages = await message.channel.messages.fetch({ limit: 10 });
      // log.debug(F, `messages: ${JSON.stringify(messages, null, 2)}`);
      await chat([...messages.values()]);
    } else {
      try {
        await message.react(emojiGet('ts_heart'));
      } catch (e) {
        log.error(F, `Error reacting to message: ${e}`);
        await message.react('💜');
      }
    }
  } else if (await isSadMessage(message)) {
    if (message.author.bot) return;
    if (message.guild.id !== env.DISCORD_GUILD_ID) return;
    // log.debug(F, 'Sad stuff detected');
    await message.react(heartEmojis[Math.floor(Math.random() * heartEmojis.length)]);
  }
  // else if (
  //   message.content.match(/(?:anyone|someone+there|here)\b/)
  //   && (message.channel as ThreadChannel).parent?.parentId !== env.CATEGORY_HARMREDUCTIONCENTRE
  //   && (message.channel as TextChannel).parentId !== env.CATEGORY_HARMREDUCTIONCENTRE
  // ) {
  //   // Find when the last message in that channel was sent
  //   const lastMessage = await message.channel.messages.fetch({
  //     before: message.id,
  //     limit: 1,
  //   });
  //   const lastMessageDate = lastMessage.first()?.createdAt;

  //   // Check if the last message was send in the last 10 minutes
  //   if (lastMessageDate && lastMessageDate.valueOf() > Date.now() - 1000 * 60 * 10) {
  //     // If it was, then don't send the message
  //     return;
  //   }

  //   await message.channel.sendTyping();
  //   setTimeout(async () => {
  //     await (message.channel.send({
  //       content: stripIndents`Hey ${message.member?.displayName}!
  //       Sometimes chat slows down, but go ahead and ask your question: Someone will get back to you when they can!
  //       Who knows, maybe someone is lurking and waiting for the right question... :eyes: `,
  //     }));
  //   }, 2000);
  // }
  // else {
  //   if (message.author.bot) return; // Dont respond to self
  //   if (message.guild.id !== env.DISCORD_GUILD_ID) return; // Dont do this off tripsit
  //   if (((Math.floor(Math.random() * (201)) / 1) !== 1)) return; // Only do this .5% of the time
  //   if (!await isVerifiedMember(message)) return; // Dont do this in the tripsitchannels
  //   if (!await isGeneralRoom(message)) return; // Dont do this in the tripsitchannels
  //   // Get the last 3 messages sent in the channel
  //   const messageHistory = await message.channel.messages.fetch({ limit: 3 });
  //   await message.channel.send(await aiChat([...messageHistory.values()]));
  // }
}
