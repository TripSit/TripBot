import {
  GuildMember,
} from 'discord.js';
import env from '../utils/env.config';
import logger from '../utils/logger';
import * as path from 'path';
import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

/**
 *
 * @param {'get' | 'set'} command
 * @param {GuildMember} member
 * @param {number | null} value
 * @param {string} type
 * @return {any} an object with information about the bot
 */
export async function karma(
    command: 'get' | 'set',
    member: GuildMember,
    value?: number | null,
    type?: string | null):Promise<string> {
  logger.debug(`[${PREFIX}] starting!`);

  logger.debug(`[${PREFIX}] timezone: ${command} ${member} ${value} ${type}`);

  if (command === 'set') {
    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_USERS}/${member.id}/karma/${type}`);
      ref.set(value);
      logger.debug(`[${PREFIX}] finished!`);
      return `I updated ${member.displayName} ${type} to ${value}`;
    }
  } else if (command === 'get') {
    type karmaEntry = {
      'karma_received': number,
      'karma_given': number,
    }
    let resp = '';
    const ref = db.ref(`${env.FIREBASE_DB_USERS}/${member.id}/karma`);
    await ref.once('value', (data) => {
      if (data.val() !== null) {
        // logger.debug(`[${PREFIX}] data is VALUE`);
        const karma = data.val() as karmaEntry;
        // logger.debug(`[${PREFIX}] karma: ${JSON.stringify(karma, null, 2)}`);
        resp = stripIndents`${member.displayName} has received ${karma.karma_received ?? 0} karma and given \
${karma.karma_given ?? 0} karma!`;
      } else {
        // logger.debug(`[${PREFIX}] data is NULL`);
        resp = `${member.displayName} is a blank canavas <3 (and does not have karma)`;
      }
    });
    return resp;
  }
  logger.debug(`[${PREFIX}] finished!`);
  return 'If you can see this, something went terribly wrong, tell Moonbear';
};
