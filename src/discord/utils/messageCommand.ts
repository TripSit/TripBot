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

/**
 * Template
 * @param {Message} message The message that was sent
 * @return {Promise<void>}
**/
export async function messageCommand(message: Message): Promise<void> {
  logger.debug(`[${PREFIX}] starting!`);
  // logger.debug(`[${PREFIX}] message: ${JSON.stringify(message, null, 2)}!`);
  logger.debug(stripIndents`[${PREFIX}] ${message.member!.displayName} said\
  ${message.content} in ${(message.channel as GuildTextBasedChannel).name}!`);
  logger.debug(`[${PREFIX}] finished!`);

  if (message.content.startsWith('~')) {
    // Find the word that appears after ~
    const command = message.content.split(' ')[0].slice(1);
    logger.debug(`[${PREFIX}] command: ${command}`);
    if (command === 'tripsit') {
      const roleTripsitter = message.guild!.roles.cache.find((role) => role.id === env.ROLE_TRIPSITTER) as Role;
      const roleHelper = message.guild!.roles.cache.find((role) => role.id === env.ROLE_HELPER) as Role;
      message.channel.send(
          `Hey ${roleTripsitter} and ${roleHelper}, ${message.member!.displayName} could use some help!`);
    } else {
      message.channel.send(`Hey ${message.member!.displayName}, use /help to get a list of commands on discord!`);
    }
  }
};
