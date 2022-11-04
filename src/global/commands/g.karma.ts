import {stripIndents} from 'common-tags';
import {getUser} from '../utils/knex';
import {parse} from 'path';
const PREFIX = parse(__filename).name;
import log from '../utils/log';

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
  const response = stripIndents`has received ${userData.karma_received} karma and given ${userData.karma_given} karma`;
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
};
