import {
  ChannelType,
  Message,
  // GuildTextBasedChannel,
  Role,
  PermissionResolvable,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { sleep } from '../commands/guild/d.bottest';
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

/**
 * Template
 * @param {Message} message The message that was sent
 * @return {Promise<void>}
* */
export async function messageCommand(message: Message): Promise<void> {
  if (!message.guild) return; // If not in a guild then ignore all messages
  // if (message.guild.id !== env.DISCORD_GUILD_ID) return; // If not in tripsit ignore all messages
  const displayName = message.member ? message.member.displayName : message.author.username;

  // log.debug(F, `Message : ${JSON.stringify(message, null, 2)}`);
  // log.debug(F, `sadStuff.some(word => (message.cleanContent.includes(word): ${sadStuff.some(word => message.cleanContent.includes(word))}`); // eslint-disable-line
  // log.debug(F, `!(message.cleanContent.substring(message.cleanContent.indexOf(':') + 1).includes(':')): ${!(message.cleanContent.substring(message.cleanContent.indexOf(':') + 1).includes(':'))}`); // eslint-disable-line
  // log.debug(F, `message.channel.type !== ChannelType.DM: ${message.channel.type !== ChannelType.DM}`); // eslint-disable-line
  // log.debug(F, `message.guild.id !== env.DISCORD_GUILD_ID: ${message.guild.id} !== ${env.DISCORD_SERVER_ID}`); // eslint-disable-line

  log.debug(F, `message.reference: ${JSON.stringify(message.content, null, 2)}`);

  // log.debug(stripIndents`[${PREFIX}] ${displayName} said\
  // ${message.content} in ${(message.channel as GuildTextBasedChannel).name}!`);

  if (message.content.startsWith('~')) {
    // If you try to use the old tripbot command prefix while inside of the tripsit guild
    if (message.guild.id !== env.DISCORD_GUILD_ID) return;
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
      await message.channel.send(
        `Hey ${displayName}, thank you for asking for help! We've notified our ${roleTripsitter} and\
${roleHelper}. Can you start off by telling us how much you took and the details of your problem?`,
      );
      // Update helpCounter with the current date that the user sent this command
      helpCounter.set(message.author.id, Date.now().valueOf());
    } else {
      await message.channel.send(`Hey ${displayName}, use /help to get a list of commands on discord!`);
    }
  } else if (message.content.startsWith(`_pokes <@${env.DISCORD_CLIENT_ID}>_`)) {
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
  } else if (message.mentions.has(env.DISCORD_CLIENT_ID)) {
    // If the bot was mentioned

    // Check if the user sending the message is the bot owner
    if ((message.content.toLowerCase().includes('upload') || message.content.toLowerCase().includes('steal')) && message.content.toLowerCase().includes('emoji')) {
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
    } else if (message.content.toLowerCase().includes('upload') && message.content.toLowerCase().includes('sticker')) {
      // Check if the user has the ManageEmojis permission
      if (!message.member?.permissions.has('ManageEmojisAndStickers' as PermissionResolvable)) {
        await message.channel.send(stripIndents`Hey ${displayName}, you don't have the permission to upload stickers to this guild!`); // eslint-disable-line
        return;
      }
      await message.channel.send(stripIndents`Hey ${displayName}, uploading emojis...`); // eslint-disable-line

      log.debug(F, `message.stickers: ${message.stickers}`);
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
    } else if (message.author.id === env.DISCORD_OWNER_ID) {
      if (message.content.toLowerCase().includes('initiate') && message.content.toLowerCase().includes('phoenix')) {
        const phoenixMessage = await message.channel.send('Phoenix protocol initiated... ');
        await sleep(1000);
        await phoenixMessage.edit('Phoenix protocol initiated... 35%');
        await sleep(1000);
        await phoenixMessage.edit('Phoenix protocol initiated... 68%');
        await sleep(1000);
        await phoenixMessage.edit(`Phoenix protocol deployed. Good luck ${message.member?.displayName} <3`);
        return;
      }

      const action = message.content.split(`<@${client.user?.id}>`)[1];
      log.debug(F, `action: ${action}`);

      // Replace all instances of "your" with "my", make the action first person
      const actionFirstPerson = action.replace(/your/g, 'my');
      log.debug(F, `actionFirstPerson: ${actionFirstPerson}`);

      // If the user is the bot owner, do whatever they say
      await message.channel.send(stripIndents`Sure thing ${displayName}! I will${actionFirstPerson}!`); // eslint-disable-line
    } else {
      await message.react('<:ts_heart:1085657783069851658>');
    }
  } else if (
    // If 'tripbot' is mentioned in text
    message.content.toLowerCase().includes('tripbot')
    && message.channel.type !== ChannelType.DM) {
    if (message.author.bot) {
      // Keep this here because web bots need to be able to use ~tripsit
      // log.debug(F, `Ignoring bot interaction`);
      return;
    }
    await message.react('<:ts_heart:1085657783069851658>');
    // const responses = [
    //   '*boops quietly*',
    //   '*beeps quietly*',
    // ];
    // await message.channel.send(responses[Math.floor(Math.random() * responses.length)]);
  } else if (
    sadStuff.some(word => (message.cleanContent.includes(word)
     && !(message.cleanContent.substring(message.cleanContent.indexOf(':') + 1).includes(':'))))
    && message.channel.type !== ChannelType.DM) {
    if (message.author.bot) return;
    if (message.guild.id !== env.DISCORD_GUILD_ID) return;
    // log.debug(F, 'Sad stuff detected');
    await message.react(heartEmojis[Math.floor(Math.random() * heartEmojis.length)]);
  }
}
