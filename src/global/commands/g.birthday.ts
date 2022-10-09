/* eslint-disable max-len */
import {
  GuildMember,
} from 'discord.js';
import logger from '../utils/logger';
import env from '../utils/env.config';
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
    }
    const birthday = {
      month: month,
      day: day,
    };

    // logger.debug(`[${PREFIX}] Setting ${userId}/birthday = ${birthday}`);
    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_USERS}/${member.id}/birthday`);
      ref.set(birthday);
    }
    return `${month} ${day} is your new birthday!`;
  } else if (command === 'get') {
    type birthdayEntry = {
      'month': string,
      'day': number,
    }
    let resp = '';
    const ref = db.ref(`${env.FIREBASE_DB_USERS}/${member.id}/birthday`);
    await ref.once('value', (data) => {
      if (data.val() !== null) {
        const birthday = data.val() as birthdayEntry;
        logger.debug(`[${PREFIX}] birthday: ${JSON.stringify(birthday)}`);
        resp = `${member.displayName} was born on ${birthday.month} ${birthday.day}`;
      } else {
        logger.debug(`[${PREFIX}] data is NULL`);
        resp = `${member.displayName} is immortal <3 (and has not set a birthday)`;
      }
    });
    return resp;
  }
};
