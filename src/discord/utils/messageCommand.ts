import {
  Message,
  GuildTextBasedChannel,
  Role,
} from 'discord.js';
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';
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
  // logger.debug(`[${PREFIX}] starting!`);
  // logger.debug(`[${PREFIX}] message: ${JSON.stringify(message, null, 2)}!`);
  const displayName = message.member ? message.member.displayName : message.author.username;

  logger.debug(stripIndents`[${PREFIX}] ${displayName} said\
  ${message.content} in ${(message.channel as GuildTextBasedChannel).name}!`);
  // logger.debug(`[${PREFIX}] finished!`);

  if (message.content.startsWith('~')) {
    // Find the word that appears after ~
    const command = message.content.split(' ')[0].slice(1);
    logger.debug(`[${PREFIX}] command: ${command}`);


    if (command === 'tripsit') {
      const now = Date.now().valueOf();
      if (helpCounter.has(message.author.id)) {
        const lastTime = helpCounter.get(message.author.id);
        if (now - lastTime! < 1000 * 60 * 5) {
          message.channel.send(stripIndents`Hey ${displayName}, you just used that command, \
give people a chance to answer 😄 If no one answers in 5 minutes you can try again.`);
          return;
        }
      }
      const roleTripsitter = message.guild!.roles.cache.find((role) => role.id === env.ROLE_TRIPSITTER) as Role;
      const roleHelper = message.guild!.roles.cache.find((role) => role.id === env.ROLE_HELPER) as Role;
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
  } else if (message.mentions.has(message.client.user!)) {
    const responses = [
      `*boops quietly*`,
      `*beeps quietly*`,
    ];
    message.channel.send(responses[Math.floor(Math.random() * responses.length)]);
  }
};
