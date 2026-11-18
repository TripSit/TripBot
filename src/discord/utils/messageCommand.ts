/* eslint-disable max-len */

import { stripIndents } from 'common-tags';
import {
  DMChannel,
  EmbedBuilder,
  Guild,
  Message,
  PermissionResolvable,
  Role,
  TextChannel,
} from 'discord.js';
import { sleep } from './sleep';
import { getOrCreateUser } from '../../global/utils/dbRecords';
import { randomItem } from '../../global/utils/random';
import { handleCodeAgentRequest } from './codeAgentRequest';

const F = f(__filename); // eslint-disable-line

const helpCounter = new Map<string, number>();

export default messageCommand;

const tripsitChannels = [
  env.CHANNEL_TRIPSIT,
  env.CHANNEL_OPENTRIPSIT1,
  env.CHANNEL_OPENTRIPSIT2,
  env.CHANNEL_WEBTRIPSIT1,
  env.CHANNEL_WEBTRIPSIT2,
];

const heartEmojis = [
  '❤', '🧡', '💛', '💚', '💙', '💜', '💝', '💖', '💗', '💘', '💕', '💞', '💓', '💟', '❣', '🫂',
];

async function messageContainsHearts(message: Message): Promise<boolean> {
  return heartEmojis.some(word => (message.cleanContent.includes(word)
    && !(message.cleanContent.substring(message.cleanContent.indexOf(':') + 1).includes(':'))));
}

async function isIrcCommand(message: Message): Promise<boolean> {
  return message.cleanContent.startsWith('~');
}

async function isPokingTripbot(message: Message): Promise<boolean> {
  return message.content.startsWith(`_pokes <@${env.DISCORD_CLIENT_ID}>_`);
}

async function isMentioningTripbot(message: Message): Promise<boolean> {
  return Boolean(message.mentions.users.has(env.DISCORD_CLIENT_ID)) || Boolean(message.mentions.roles.has(env.ROLE_TRIPBOT));
}

async function isUploadMessage(message: Message): Promise<boolean> {
  const content = message.content.toLowerCase().trim();

  // Check for specific command patterns with !
  const uploadCommands = ['!upload', '!steal', '!fetch'];

  return uploadCommands.some(command => content.includes(command));
}

async function isBotOwner(message: Message): Promise<boolean> {
  return message.author.id === env.DISCORD_OWNER_ID;
}

type GuildTextContext = {
  message: Message;
  channel: TextChannel;
  guild: Guild;
  displayName: string;
};

async function handleTripsitCommand({
  message, channel, guild, displayName,
}: GuildTextContext): Promise<void> {
  // If not in a tripsit channel and not in a specific users custom tripsit channel, tell them where to go and return.
  if (!tripsitChannels.includes(channel.id) && !channel.name.endsWith(`${message.author.displayName}'s channel!`)) {
    const channelTripsit = await guild.channels.fetch(env.CHANNEL_TRIPSIT) as TextChannel;
    const channelOpenTripsit1 = await guild.channels.fetch(env.CHANNEL_OPENTRIPSIT1) as TextChannel;
    await channel.send({
      content: stripIndents`Hey ${displayName}, this command is reserved for the tripsitting channels. Head on over to ${channelTripsit} or ${channelOpenTripsit1} and try again if you need help! <3`,
      allowedMentions: {
        parse: [],
      },
    });
    return;
  }
  const now = Date.now().valueOf();
  if (helpCounter.has(message.author.id)) {
    const lastTime = helpCounter.get(message.author.id) as number;
    if (now - lastTime < 1000 * 60 * 5) {
      await channel.send({
        content: stripIndents`Hey ${displayName}, you just used that command, \
          give people a chance to answer 😄 If no one answers in 5 minutes you can try again.`,
        allowedMentions: { parse: [] },
      });

      return;
    }
  }
  const roleTripsitter = await guild.roles.fetch(env.ROLE_TRIPSITTER) as Role;
  const roleHelper = await guild.roles.fetch(env.ROLE_HELPER) as Role;
  await channel.send({
    content: `Hey ${displayName}, someone from the ${roleTripsitter} and/or ${roleHelper} team will be with you as soon as they're available!

      If you’re in the right mindset please start by telling us what you took, at what dose and route, how long ago, along with any concerns you may have.

      **If this is a medical emergency** please contact your local emergency services: we do not call EMS on behalf of anyone.
      `,
    allowedMentions: {
      roles: [roleTripsitter.id, roleHelper.id],
      users: [], // prevents user pings
      parse: [], // prevents @everyone/@here
    },
  });

  const embed = new EmbedBuilder()
    .setTitle('Other Resources')
    .setDescription(`**Not in an emergency, but still want to talk to a mental health advisor?**
        The [Warm line directory](https://warmline.org/warmdir.html#directory) provides non-crisis mental health support and guidance from trained volunteers.

        **Want to text or voice chat with someone?**
        The wonderful people at the [Fireside Project](https://firesideproject.org) can also help you through a rough trip.
        
        **Need LGBT support?**
        The [LGBT Hotline](https://www.lgbthotline.org) and [The Trevor Project](https://www.thetrevorproject.org/) are great resources.
        
        **Check the pins and use </crisis:1088811157185372180> for other info!!**`);

  await channel.send({
    embeds: [embed],
  });
  // Update helpCounter with the current date that the user sent this command
  helpCounter.set(message.author.id, Date.now().valueOf());
}

async function handleIrcCommand(context: GuildTextContext): Promise<void> {
  const {
    message, channel, guild, displayName,
  } = context;
  // If you try to use the old tripbot command prefix while inside of the tripsit guild
  if (guild.id !== env.DISCORD_GUILD_ID) return;

  // Find the word that appears after ~
  const command = message.content.split(' ')[0].slice(1);
  if (command === 'tripsit') {
    await handleTripsitCommand(context);
  } else {
    await channel.send({
      content: `Hey ${displayName}, use /help to get a list of commands on Discord!`,
      allowedMentions: {
        parse: [], // disables all user, role, and @everyone pings
      },
    });
  }
}

async function giveTokens(message: Message): Promise<void> {
  // use regex to find the number in the message.cleanContent
  const amount = parseInt(/(\d+)/.exec(message.cleanContent)?.[0] ?? '0', 10);

  const recipients = message.mentions.users;

  recipients.forEach(async recipient => {
    if (recipient.bot) return;

    const recipientMember = await message.guild?.members.fetch(recipient.id);

    // Not a member (or a lookup outside a guild): there is nobody to give tokens to
    if (!recipientMember) return;

    const userData = await getOrCreateUser(recipient.id);

    const personaData = await db.personas.upsert({
      where: { user_id: userData.id },
      create: {
        user_id: userData.id,
        tokens: amount,
      },
      update: {
        tokens: {
          increment: amount,
        },
      },
    });
    log.debug(F, `Gave ${amount} tokens to ${recipientMember.displayName}!`);
    if (message.channel instanceof TextChannel || message.channel instanceof DMChannel) {
      await message.channel.send(stripIndents`Gave ${amount} tokens to ${recipientMember.displayName}!

          They now have ${personaData.tokens} tokens!`);
    }
  });
}

async function runPhoenixProtocol(message: Message, channel: TextChannel): Promise<void> {
  const phoenixMessage = await channel.send('Phoenix protocol initiated... ');
  await sleep(1000);
  await phoenixMessage.edit('Phoenix protocol initiated... 35%');
  await sleep(1000);
  await phoenixMessage.edit('Phoenix protocol initiated... 68%');
  await sleep(1000);
  await phoenixMessage.edit(`Phoenix protocol deployed. Good luck ${message.member?.displayName} <3`);
  await sleep(3000);
  await phoenixMessage.delete();
  await message.delete();
}

async function uploadEmojis({
  message, channel, guild, displayName,
}: GuildTextContext): Promise<void> {
  // Upload all the emojis in the message to the guild
  let emojis = message.content.match(/<a?:\w+:\d+>/g);

  if (!emojis && message.reference?.messageId) {
    // try to get emojis from the message reference
    const referencedMessage = await channel.messages.fetch(message.reference.messageId);
    emojis = referencedMessage.content.match(/<a?:\w+:\d+>/g);
  }

  if (!emojis) return;

  const replyMessage = await channel.send(stripIndents`Hey ${displayName}, uploading emojis...`); // eslint-disable-line
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
      const emojiData = await guild.emojis.create({ name: emojiName, attachment: emojiUrl }); // eslint-disable-line

      emojiSuccessList.push(`<${emojiAnimated ? 'a' : ''}:${emojiData.name}:${emojiData.id}>`);
    } catch (e) {
      log.error(F, `Error creating emoji: ${e}`);
      emojiFailList.push(emoji);
    }
    // So we don't hit limits by doing this too often
    sleep(1000);
  }
  const failedString = emojiFailList.length > 0
    ? `\nFailed to upload ${emojiFailList.join(' ')} to ${guild.name}!`
    : '';
  await replyMessage.edit(stripIndents`Uploaded ${emojiSuccessList.join(' ')} to ${guild.name}!${failedString}`); // eslint-disable-line
}

async function uploadStickers({
  message, channel, guild, displayName,
}: GuildTextContext): Promise<void> {
  await channel.send(stripIndents`Hey ${displayName}, uploading emojis...`); // eslint-disable-line

  log.debug(F, `message.stickers: ${JSON.stringify(message.stickers, null, 2)}`);
  // Upload all the stickers in the message to the guild
  const stickers = message.content.match(/<a?:\w+:\d+>/g);
  log.debug(F, `stickers: ${stickers}`);
  if (message.stickers) {
    const stickerList = [];
    for (const sticker of message.stickers.values()) { // eslint-disable-line
      log.debug(F, `sticker: ${JSON.stringify(sticker, null, 2)}`);
      await guild.stickers.create({ name: sticker.name, file: sticker.url, tags: 'grinning' }); // eslint-disable-line
      stickerList.push(sticker.name);
    }
    log.debug(F, `stickerList: ${stickerList}`);
    log.debug(F, `stickerList: ${stickerList.join(' ')}`);

    await channel.send(`Uploaded ${stickerList.join(' ')} to ${guild.name}!`); // eslint-disable-line
  }
}

async function handleUploadMessage(context: GuildTextContext): Promise<void> {
  const { message, channel, displayName } = context;
  if (!message.member?.permissions.has('ManageEmojisAndStickers' as PermissionResolvable)) {
    await channel.send({
      content: `Hey ${displayName}, you don't have permission to manage emojis and stickers!`,
      allowedMentions: { parse: [] },
    });
    return;
  }

  if (message.content.toLowerCase().includes('emoji')) {
    await uploadEmojis(context);
  }
  if (message.content.toLowerCase().includes('sticker')) {
    await uploadStickers(context);
  }
}

async function reactToMention(message: Message): Promise<void> {
  try {
    await message.react(emojiGet('ts_heart'));
  } catch (e) {
    log.error(F, `Error reacting to message: ${e}`);
    try {
      await message.react('💜');
    } catch {
      // The fallback reaction failed (for example missing permissions); nothing more to do.
    }
  }
}

async function handleMention(context: GuildTextContext): Promise<void> {
  const { message, channel } = context;
  // If the bot was mentioned
  const lowerContent = message.content.toLowerCase();
  const fromOwner = await isBotOwner(message);

  // "@tripbot there's an issue with X, fix it" (developers only; see canUseCodeAgent)
  if (await handleCodeAgentRequest(message)) return;

  if (fromOwner && lowerContent.includes('tokens') && lowerContent.includes('give')) {
    await giveTokens(message);
    return;
  }

  if (fromOwner && lowerContent.includes('phoenix')) {
    await runPhoenixProtocol(message, channel);
    return;
  }

  if (await isUploadMessage(message)) {
    await handleUploadMessage(context);
  } else {
    await reactToMention(message);
  }
}

async function reactToHearts(message: Message, guild: Guild): Promise<void> {
  if (message.author.bot) return;
  if (guild.id !== env.DISCORD_GUILD_ID) return;
  try {
    await message.react(randomItem(heartEmojis));
  } catch {
    log.info(F, `Failed to add heart reaction in ${guild.name}(${guild.id}).`);
  }
}

/**
 * Message Command
 * @param {Message} message The message that was sent
 * @return {Promise<void>}
* */
export async function messageCommand(message: Message): Promise<void> {
  if (!message.guild) return; // If not in a guild then ignore all messages
  const displayName = message.member ? message.member.displayName : message.author.username;

  // Ignore messages that start with ~~, these are usually strikethrough messages
  if (message.content.startsWith('~~')) { return; }

  if (!(message.channel instanceof TextChannel)) {
    return;
  }

  const context: GuildTextContext = {
    message, channel: message.channel, guild: message.guild, displayName,
  };

  if (await isIrcCommand(message)) {
    await handleIrcCommand(context);
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
    await message.channel.send(randomItem(faces));
  } else if (await isMentioningTripbot(message)) {
    await handleMention(context);
  } else if (await messageContainsHearts(message)) {
    await reactToHearts(message, message.guild);
  }
}
