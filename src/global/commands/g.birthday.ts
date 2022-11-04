import {DateTime} from 'luxon';
import {db, getUser} from '../utils/knex';
import {Users} from '../@types/pgdb';
import log from '../utils/log';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 * Birthday information of a user
 * @param {'get' | 'set'} command
 * @param {GuildMember} memberId
 * @param {string} month The birthday month
 * @param {number} day The birthday day
 * @return {any} an object with information about the bot
 */
export async function birthday(
  command: 'get' | 'set',
  memberId: string,
  month?: string | null,
  day?: number | null):Promise<any> {
  if (command === 'set') {
    log.debug(`[${PREFIX}] ${command} ${memberId} ${month} ${day}`);
    if (month === null || day === null) {
      return 'You need to specify a month and day!';
    }
    const month30 = ['April', 'June', 'September', 'November'];
    const month31 = ['January', 'March', 'May', 'July', 'August', 'October', 'December'];
    if (month !== undefined && day !== undefined) {
      if (month30.includes(month) && day > 30) {
        return `${month} only has 30 days!`;
      }
      if (month31.includes(month) && day > 31) {
        return `${month} only has 31 days!`;
      }
      if (month === 'February' && day > 28) {
        return 'February only has 28 days!';
      }
      const monthDict = {
        'january': 0,
        'february': 1,
        'march': 2,
        'april': 3,
        'may': 4,
        'june': 5,
        'july': 6,
        'august': 7,
        'september': 8,
        'october': 9,
        'november': 10,
        'december': 11,
      };

      const birthday = new Date(2000, monthDict[month.toLowerCase() as keyof typeof monthDict], day);

      log.debug(`[${PREFIX}] Setting birthday for ${memberId} to ${birthday}`);

      await db<Users>('users')
        .insert({
          discord_id: memberId,
          birthday: birthday,
        })
        .onConflict('discord_id')
        .merge();

      return `${month} ${day} is your new birthday!`;
    }
  } else if (command === 'get') {
    const userData = await getUser(memberId, null);

    let resp = '';
    if (userData.birthday !== null) {
      const birthDate = userData.birthday.toISOString();
      log.debug(`[${PREFIX}] Birthdate: ${birthDate}`);
      const birthday = DateTime.fromISO(birthDate);
      log.debug(`[${PREFIX}] birthday: ${birthday}`);
      resp = `was born on ${birthday.monthLong} ${birthday.day}`;
    } else {
      log.debug(`[${PREFIX}] birthday is NULL`);
      resp = `is immortal <3 (and has not set a birthday)`;
    }

    return resp;
  }
};
