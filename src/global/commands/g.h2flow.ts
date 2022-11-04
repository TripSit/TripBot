import {db} from '../utils/knex';
import {Users} from '../@types/pgdb';
import log from '../utils/log';
import * as path from 'path';
// import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

/**
 * @param {string} userId
 * @return {any}
 */
export async function h2flow(userId:string):Promise<any> {
  let data = await db<Users>('users')
    .select(
      db.ref('sparkle_points').as('sparkle_points'),
      db.ref('move_points').as('move_points'),
      db.ref('empathy_points').as('empathy_points'),
    )
    .where('discord_id', userId);

  if (data.length === 0) {
  // User doesn't exist in the database
    log.debug(`[${PREFIX}] User doesn't exist in the database: ${userId}`);
    // Create new user
    data = await db('users')
      .insert({
        discord_id: userId,
        sparkle_points: 0,
        move_points: 0,
        empathy_points: 0,
      })
      .returning(['sparkle_points', 'move_points', 'empathy_points']);
  }
  return data[0];
};
