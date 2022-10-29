import {
  GuildMember,
} from 'discord.js';
import {DateTime} from 'luxon';
import {db} from '../utils/knex';
import {Users} from '../@types/pgdb';
import logger from '../utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 * Birthday information of a user
 * @param {'get' | 'set'} command
 * @param {GuildMember} member
 * @param {string} month The birthday month
 * @param {number} day The birthday day
 * @return {any} an object with information about the bot
 */
export async function birthday(
  command: 'get' | 'set',
  member: GuildMember,
  month?: string,
  day?: number):Promise<any> {
  if (command === 'set') {
    logger.debug(`[${PREFIX}] ${command} ${member} ${month} ${day}`);
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

      logger.debug(`[${PREFIX}] Setting birthday for ${member.user.username} to ${birthday}`);

      await db
        .insert({
          discord_id: member.id,
          birthday: birthday,
        })
        .into('users')
        .onConflict('discord_id')
        .merge();

      return `${month} ${day} is your new birthday!`;
    }
  } else if (command === 'get') {
    const data = await db
      .select(db.ref('birthday').as('birthday'))
      .from<Users>('users')
      .where('discord_id', member.id);

    logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 2)}`);

    let resp = '';
    if (data.length > 0) {
      if (data[0].birthday !== null) {
        const birthDate = data[0].birthday.toISOString();
        logger.debug(`[${PREFIX}] Birthdate: ${birthDate}`);
        const birthday = DateTime.fromISO(birthDate);
        logger.debug(`[${PREFIX}] birthday: ${birthday}`);
        resp = `${member.displayName} was born on ${birthday.monthLong} ${birthday.day}`;
      } else {
        logger.debug(`[${PREFIX}] birthday is NULL`);
        resp = `${member.displayName} is immortal <3 (and has not set a birthday)`;
      }
    } else {
      logger.debug(`[${PREFIX}] data is NULL`);
      resp = `${member.displayName} is immortal <3 (and has not set a birthday)`;
    }
    return resp;
  }
};
