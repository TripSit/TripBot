/* eslint-disable max-len */
import {db} from '../../global/utils/knex';
import {
  Users,
  UserExperience,
} from '../../global/@types/pgdb.d';
// import timezones from '../../global/assets/data/timezones.json';
import Canvas from '@napi-rs/canvas';
import * as path from 'path';
import logger from '../../global/utils/logger';
const PREFIX = path.parse(__filename).name;

Canvas.GlobalFonts.registerFromPath(
  path.resolve(__dirname, '../../assets/img/Futura.otf'),
  'futura',
);

/**
 * Get and set someone's timezone!
 * @param {string} memberId The user to either set or get the timezone!
 * @return {any[]} an object with information about the bot
 */
export async function profile(
  memberId: string,
):Promise<any> {
  logger.debug(`[${PREFIX}] memberId: ${memberId}`);
  const data = await db
    .select('*')
    .from<Users>('users')
    // .join<UserExperience>('user_experience', {'user_experience.user_id': 'users.id'})
    .where('users.discord_id', memberId);

  logger.debug(`[${PREFIX}] data: ${JSON.stringify(data)}`);

  const data2 = await db
    .select('*')
    .from<UserExperience>('user_experience')
    .where('user_id', data[0].id);

  logger.debug(`[${PREFIX}] data2: ${JSON.stringify(data2)}`);

  return data;
}
