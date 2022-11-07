import {DateTime} from 'luxon';
import {db, getUser} from '../utils/knex';
import {Users} from '../@types/pgdb';
import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 * Birthday information of a user
 * @param {'get' | 'set'} command
 * @param {GuildMember} memberId
 * @param {string} month The birthday month
 * @param {number} day The birthday day
 * @return {string} an object with information about the bot
 */
export async function birthday(
  command: 'get' | 'set',
  memberId: string,
  month?: number | null,
  day?: number | null,
):Promise<DateTime | null> {
  let response = {} as DateTime | null;
  if (command === 'set') {
    // log.debug(`[${PREFIX}] ${command} ${memberId} ${month} ${day}`);
    const birthday = DateTime.utc(2000, month as number, day as number);

    // log.debug(`[${PREFIX}] Setting birthday for ${memberId} to ${birthday}`);

    await db<Users>('users')
      .insert({
        discord_id: memberId,
        birthday: birthday.toJSDate(),
      })
      .onConflict('discord_id')
      .merge();
    response = birthday;
  } else if (command === 'get') {
    const userData = await getUser(memberId, null);
    if (userData.birthday !== null) {
      const birthDate = userData.birthday;
      // log.debug(`[${PREFIX}] birthDate: ${birthDate}`);
      const birthday = DateTime.fromJSDate(birthDate, {zone: 'utc'});
      // log.debug(`[${PREFIX}] birthday: ${birthday}`);
      response = birthday;
    } else {
      // log.debug(`[${PREFIX}] birthday is NULL`);
      response = null;
    }
  }
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  log.info(`[${PREFIX}] response: ${JSON.stringify(response?.toJSDate().toString(), null, 2)}`);

  return response;
};
