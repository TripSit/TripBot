import {stripIndents} from 'common-tags';
import {getUser} from '../utils/knex';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;
// import log from '../utils/log';

/**
 *
 * @param {'get' | 'set'} command
 * @param {string} memberId
 * @param {number | null} value
 * @param {string} type
 * @return {any} an object with information about the bot
 */
export async function karma(
  command: 'get' | 'set',
  memberId: string,
  value?: number | null,
  type?: string | null):Promise<string> {
  // log.debug(`[${PREFIX}] starting!`);

  const userData = await getUser(memberId, null);
  // log.debug(`[${PREFIX}] finished!`);
  return stripIndents`has received ${userData.karma_received} karma and given ${userData.karma_given} karma`;
};
