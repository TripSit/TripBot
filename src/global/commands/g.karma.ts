import {stripIndents} from 'common-tags';
import {db} from '../utils/knex';
import {Users} from '../@types/pgdb';
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

  // log.debug(`[${PREFIX}] karma: ${command} ${memberId} ${value} ${type}`);
  let response = 'If you can see this, something went terribly wrong, tell Moonbear';
  if (command === 'get') {
    const data = await db
      .select(
        db.ref('karma_received').as('karma_received'),
        db.ref('karma_given').as('karma_given'),
      )
      .from<Users>('users')
      .where('discord_id', memberId);

    if (data.length === 0) {
      response = ' is a blank canavas <3 (and does not have karma)';
    } else {
      response = stripIndents`has received ${data[0].karma_received} karma and given ${data[0].karma_given} karma`;
    }
  }
  // log.debug(`[${PREFIX}] finished!`);
  return response;
};
