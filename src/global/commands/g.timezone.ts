/* eslint-disable max-len */
import logger from '../utils/logger';
import env from '../utils/env.config';
import timezones from '../assets/data/timezones.json';
import * as path from 'path';
import {GuildMember} from 'discord.js';
const PREFIX = path.parse(__filename).name;

/**
 * Information about the bot!
 * @param {'get' | 'set'} command
 * @param {GuildMember} member The key of the user who set their birthday
 * @param {string} timezone The timezone
 * @return {any} an object with information about the bot
 */
export async function timezone(
    command: 'get' | 'set',
    member: GuildMember,
    timezone?:string | null):Promise<any> {
  logger.debug(`[${PREFIX}] timezone: ${command} ${member} ${timezone}`);

  if (command === 'set') {
    // define offset as the value from the timezones array
    let tzCode = '';
    for (let i = 0; i < timezones.length; i += 1) {
      if (timezones[i].label === timezone) {
        tzCode = timezones[i].tzCode;
        logger.debug(`[${PREFIX}] tzCode: ${tzCode}`);
      }
    }
    // logger.debug(`[${PREFIX}] actor.id: ${actor.id}`);

    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_USERS}/${member.id}/timezone`);
      ref.set(tzCode);
      logger.debug(`[${PREFIX}] finished!`);
      return `I updated your timezone to ${timezone}`;
    }
    return `${timezone} is your new timezone!`;
  } else if (command === 'get') {
    let tzCode = '';
    const ref = db.ref(`${env.FIREBASE_DB_USERS}/${member.id}/timezone`);
    await ref.once('value', (data) => {
      if (data.val() !== null) {
        tzCode = data.val();
      } else {
        return `${member.displayName} is a timeless treasure <3 (and has not set a time zone)`;
      }
    });

    let gmtValue = '';
    for (let i = 0; i < timezones.length; i += 1) {
      if (timezones[i].tzCode === tzCode) {
        gmtValue = timezones[i].offset;
        logger.debug(`${PREFIX} gmtValue: ${gmtValue}`);
      }
    }

    // get the user's timezone from the database
    const timestring = new Date().toLocaleTimeString('en-US', {timeZone: tzCode});
    return `It is likely ${timestring} (GMT${gmtValue}) wherever ${member.displayName} is located.`;
    logger.debug(`[${PREFIX}] finished!`);
  }
};
