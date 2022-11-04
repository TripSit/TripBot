import {
  ChannelType,
  Message,
  // GuildTextBasedChannel,
  Role,
} from 'discord.js';
import env from '../../global/utils/env.config';
import log from '../../global/utils/log';
import * as path from 'path';
import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

const helpCounter = new Map<string, number>();

/**
 * Template
 * @param {Message} message The message that was sent
 * @return {Promise<void>}
**/
export async function messageCommand(message: Message): Promise<void> {
  if (!message.guild) return; // If not in a guild then ignore all messages
  if (message.guild.id !== env.DISCORD_GUILD_ID) return; // If not in tripsit ignore all messages
  // log.debug(`[${PREFIX}] starting!`);
  const displayName = message.member ? message.member.displayName : message.author.username;

  // log.debug(stripIndents`[${PREFIX}] ${displayName} said\
  // ${message.content} in ${(message.channel as GuildTextBasedChannel).name}!`);

  if (message.content.startsWith('~')) {
    // Find the word that appears after ~
    const command = message.content.split(' ')[0].slice(1);
    log.debug(`[${PREFIX}] command: ${command}`);


    if (command === 'tripsit') {
      const now = Date.now().valueOf();
      if (helpCounter.has(message.author.id)) {
        const lastTime = helpCounter.get(message.author.id);
        if (!lastTime) {
          // log.debug(`[${PREFIX}] lastTime is undefined!`);
          return;
        };
        if (now - lastTime < 1000 * 60 * 5) {
          message.channel.send(stripIndents`Hey ${displayName}, you just used that command, \
give people a chance to answer 😄 If no one answers in 5 minutes you can try again.`);
          return;
        }
      }
      const roleTripsitter = message.guild.roles.cache.find((role) => role.id === env.ROLE_TRIPSITTER) as Role;
      const roleHelper = message.guild.roles.cache.find((role) => role.id === env.ROLE_HELPER) as Role;
      message.channel.send(
        `Hey ${displayName}, thank you for asking for help! We've notified our ${roleTripsitter} and\
${roleHelper}. Can you start off by telling us how much you took and the details of your problem?`);
      // Update helpCounter with the current date that the user sent this command
      helpCounter.set(message.author.id, Date.now().valueOf());
    } else {
      message.channel.send(`Hey ${displayName}, use /help to get a list of commands on discord!`);
    }
  } else if (message.content.startsWith(`_pokes <@${env.DISCORD_CLIENT_ID}>_`)) {
    const faces = [
      '( ͡° ͜ʖ ͡°)',
      '😯',
      '😳',
      '😘',
      '🫣',
      '🤨',
    ];
    message.channel.send(faces[Math.floor(Math.random() * faces.length)]);
  } else if (
    (message.mentions.has(message.client.user) || message.cleanContent.toLowerCase().includes('tripbot')) &&
    message.channel.type !== ChannelType.DM) {
    if (message.author.bot) {
      // log.debug(`[${PREFIX}] Ignoring bot interaction`);
      return;
    }
    const responses = [
      `*boops quietly*`,
      `*beeps quietly*`,
    ];
    message.channel.send(responses[Math.floor(Math.random() * responses.length)]);
  }
};
