import {
  Role,
  Message,
  TextChannel,
} from 'discord.js';
import logger from '../../global/utils/logger';
import env from '../../global/utils/env.config';
import {stripIndents} from 'common-tags';

import {bigBrother} from '../../global/utils/thoughtPolice';

const PREFIX = require('path').parse(__filename).name;

/**
 * This runs on every message to determine if a badword is used
 * @param {Message} message Message to scan
 * @return {Promise<void>}
 */
export async function thoughtPolice(message:Message): Promise<void> {
  logger.debug(`[${PREFIX}] started!`);
  // logger.debug(`[${PREFIX}] ${message.member.displayName} said "${message.cleanContent}"`);
  const channelTripsitters = message.client.channels.cache.get(env.CHANNEL_TRIPSITTERS) as TextChannel;
  const roleHelper = message.guild?.roles.cache.find((role:Role) => role.id === env.ROLE_HELPER);
  const roleTripsitter = message.guild?.roles.cache.find((role:Role) => role.id === env.ROLE_TRIPSITTER);

  const result = await bigBrother(message.cleanContent.toLowerCase());

  logger.debug(`[${PREFIX}] result: ${result}`);

  if (result) {
    switch (result[0]) {
      case 'offensive':
        message.channel.send(result[1]);
        message.delete();
        break;
      case 'harm':
        if (channelTripsitters) {
          channelTripsitters.send(stripIndents`
            Hey ${roleTripsitter} and ${roleHelper}
            ${message.member?.displayName} is talking about something harmful\
             in ${(message.channel as TextChannel).name}!
            `);
        }
        break;
      case 'horny':
        message.channel.send(result[1]);
        break;
      case 'meme':
        message.channel.send(result[1]);
        break;
      case 'pg13':
        channelTripsitters.send(stripIndents`
          ${message.member?.displayName} is talking about something PG13 in ${(message.channel as TextChannel).name}!
          `);
        break;
      default:
        break;
    }
  }
  logger.debug(`[${PREFIX}] finished!`);
};
