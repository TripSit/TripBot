/* eslint-disable max-len */
import {
  GuildMember,
} from 'discord.js';
// import db, {sql} from '../utils/database';
import {DateTime} from 'luxon';
import {db} from '../utils/knex';
import {userEntry} from '../@types/pgdb.d';
import logger from '../utils/logger';
// import env from '../utils/env.config';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 * Information about the bot!
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
    // TODO: Use luxon
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
        'January': 0,
        'February': 1,
        'March': 2,
        'April': 3,
        'May': 4,
        'June': 5,
        'July': 6,
        'August': 7,
        'September': 8,
        'October': 9,
        'November': 10,
        'December': 11,
      };

      const birthday = new Date(2000, monthDict[month as keyof typeof monthDict], day);

      logger.debug(`[${PREFIX}] Setting birthday for ${member.user.username} to ${birthday}`);


      const [user] = await db('users')
        .insert({
          discord_id: member.id,
          birthday: birthday,
        })
        .onConflict('discord_id')
        .merge()
        .returning('*');

      logger.debug(`[${PREFIX}] Inserted user: ${JSON.stringify(user, null, 2)}`);

      return `${month} ${day} is your new birthday!`;
    }
  } else if (command === 'get') {
    const data = await db
      .select(db.ref('birthday').as('birthday'))
      .from<userEntry>('users')
      .where('discord_id', member.id);

    let resp = '';
    if (data[0].birthday) {
      const birthDate = data[0].birthday.toISOString();
      logger.debug(`[${PREFIX}] Birthdate: ${birthDate}`);
      const birthday = DateTime.fromISO(birthDate);
      logger.debug(`[${PREFIX}] birthday: ${birthday}`);
      resp = `${member.displayName} was born on ${birthday.monthLong} ${birthday.day}`;
    } else {
      logger.debug(`[${PREFIX}] data is NULL`);
      resp = `${member.displayName} is immortal <3 (and has not set a birthday)`;
    }
    return resp;
  }
};
