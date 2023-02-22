import {
  ChannelType,
  Message,
  // GuildTextBasedChannel,
  Role,
} from 'discord.js';
import { stripIndents } from 'common-tags';
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

/**
 * Template
 * @param {Message} message The message that was sent
 * @return {Promise<void>}
* */
export async function messageCommand(message: Message): Promise<void> {
  if (!message.guild) return; // If not in a guild then ignore all messages
  if (message.guild.id !== env.DISCORD_GUILD_ID) return; // If not in tripsit ignore all messages
  const displayName = message.member ? message.member.displayName : message.author.username;

  log.debug(F, `Message : ${JSON.stringify(message, null, 2)}`);

  // log.debug(stripIndents`[${PREFIX}] ${displayName} said\
  // ${message.content} in ${(message.channel as GuildTextBasedChannel).name}!`);

  if (message.content.startsWith('~')) {
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
  } else if (
    message.cleanContent.toLowerCase().includes('tripbot')
    && message.channel.type !== ChannelType.DM) {
    if (message.author.bot) {
      // log.debug(F, `Ignoring bot interaction`);
      return;
    }
    const responses = [
      '*boops quietly*',
      '*beeps quietly*',
    ];
    await message.channel.send(responses[Math.floor(Math.random() * responses.length)]);
  } else if (
    sadStuff.some(word => (message.cleanContent.includes(word) && !(message.cleanContent.substring(message.cleanContent.indexOf(':') + 1).includes(':'))))
    && message.channel.type !== ChannelType.DM) {
    if (message.author.bot) return;
    const heartEmojis = [
      '❤', '🧡', '💛', '💚', '💙', '💜', '💝', '💖', '💗', '💘', '💕', '💞', '💓', '💟', '❣', '🫂',
    ];

    // const heartPrefix = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
    // const heartSuffix = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];

    // const responsesHugs = [
    //   `${heartPrefix} *digitally hugs* ${heartSuffix}`,
    //   `${heartPrefix} *hugs softly* ${heartSuffix}`,
    //   `${heartPrefix} *sends virtual hug* ${heartSuffix}`,
    // ];
    // await message.channel.send(responsesHugs[Math.floor(Math.random() * responsesHugs.length)]);
    await message.react(heartEmojis[Math.floor(Math.random() * heartEmojis.length)]);
  }
}
