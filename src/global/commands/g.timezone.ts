/* eslint-disable max-len */
import logger from '../utils/logger';
import env from '../utils/env.config';
import timezones from '../assets/data/timezones.json';
import {userDbEntry} from '../../global/@types/database';
import {userExample} from '../../global/utils/exampleUser';
import * as path from 'path';
import {GuildMember} from 'discord.js';
const PREFIX = path.parse(__filename).name;

/**
 * Get and set someone's timezone!
 * @param {'get' | 'set'} command You can get 'get' or 'set' the timezone!
 * @param {GuildMember} member The user to either set or get the timezone!
 * @param {string} timezone (Not always there) The timezone!
 * @return {string} an object with information about the bot
 */
export async function timezone(
    command: 'get' | 'set',
    member: GuildMember,
    timezone?:string | null):Promise<string> {
  logger.debug(`[${PREFIX}] timezone: ${command} ${member} ${timezone}`);

  let response = '';
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
    }
    response = `I updated your timezone to ${timezone}`;
  } else if (command === 'get') {
    let tzCode = '';
    let gmtValue = '';
    if (global.db) {
      const ref = db.ref(`${env.FIREBASE_DB_USERS}/${member.id}/timezone`);
      await ref.once('value', (data) => {
        if (data.val() !== null) {
          logger.debug(`[${PREFIX}] data.val(): ${data.val()}`);
          tzCode = data.val();
        } else {
          logger.debug(`[${PREFIX}] data.val() for ${member.displayName} is null!`);
        }
      });
    } else {
      logger.warn('Firebase not initialized!');
      const targetData = userExample as userDbEntry;
      if (targetData.timezone) {
        tzCode = targetData.timezone;
      }
    }
    if (tzCode !== '') {
      for (let i = 0; i < timezones.length; i += 1) {
        if (timezones[i].tzCode === tzCode) {
          gmtValue = timezones[i].offset;
          logger.debug(`[${PREFIX}] gmtValue: ${gmtValue}`);
        }
      }
      // get the user's timezone from the database
      const timestring = new Date().toLocaleTimeString('en-US', {timeZone: tzCode});
      response = `It is likely ${timestring} (GMT${gmtValue}) wherever ${member.displayName} is located.`;
    } else {
      logger.debug(`[${PREFIX}] tzCode is empty!`);
      response = `${member.displayName} is a timeless treasure <3 (and has not set a time zone)`;
    }
  }
  return response;
};
