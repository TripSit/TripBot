/* eslint-disable max-len */
// import logger from '../utils/logger';
import env from '../utils/env.config';
// const PREFIX = require('path').parse(__filename).name;

/**
 * Information about the bot!
 * @param {string} userId The key of the user who set their birthday
 * @param {string} month The birthday month
 * @param {number} day The birthday day
 * @return {any} an object with information about the bot
 */
export async function setBirthday(
    userId: string,
    month:string,
    day:number):Promise<any> {
  // TODO: Use luxon
  const month30 = ['April', 'June', 'September', 'November'];
  const month31 = ['January', 'March', 'May', 'July', 'August', 'October', 'December'];
  if (month !== null && day !== null) {
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
  const birthday = [month, day];

  // logger.debug(`[${PREFIX}] Setting ${userId}/birthday = ${birthday}`);
  if (global.db) {
    const ref = db.ref(`${env.FIREBASE_DB_USERS}/${userId}/birthday`);
    ref.set(birthday);
  }
  return `${birthday[0]} ${birthday[1]} is your new birthday!`;
};
