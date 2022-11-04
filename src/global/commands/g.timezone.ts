/* eslint-disable max-len */
import log from '../utils/log';
import timezones from '../assets/data/timezones.json';
import {db} from '../utils/knex';
import * as path from 'path';
import {Users} from '../@types/pgdb';
const PREFIX = path.parse(__filename).name;

/**
 * Get and set someone's timezone!
 * @param {'get' | 'set'} command You can get 'get' or 'set' the timezone!
 * @param {string} memberId The user to either set or get the timezone!
 * @param {string} timezone (Not always there) The timezone!
 * @return {string} an object with information about the bot
 */
export async function timezone(
  command: 'get' | 'set',
  memberId: string,
  timezone?:string | null):Promise<string> {
  log.debug(`[${PREFIX}] timezone: ${command} ${memberId} ${timezone}`);

  let response = '';
  if (command === 'set') {
    // define offset as the value from the timezones array
    let tzCode = '';
    for (let i = 0; i < timezones.length; i += 1) {
      if (timezones[i].label === timezone) {
        tzCode = timezones[i].tzCode;
        log.debug(`[${PREFIX}] tzCode: ${tzCode}`);
      }
    }
    // log.debug(`[${PREFIX}] actor.id: ${actor.id}`);

    await db('users')
      .insert({
        discord_id: memberId,
        timezone: tzCode,
      })
      .onConflict('discord_id')
      .merge()
      .returning('*');

    return `I updated your timezone to ${timezone}`;
  } else if (command === 'get') {
    let tzCode = '';
    let gmtValue = '';

    const data = (await db
      .select(db.ref('timezone').as('timezone'))
      .from<Users>('users')
      .where('discord_id', memberId))[0].timezone;

    if (data !== null) {
      log.debug(`[${PREFIX}] data: ${data}`);
      tzCode = data;
    } else {
      log.debug(`[${PREFIX}] data is null!`);
    }

    if (tzCode !== '') {
      for (let i = 0; i < timezones.length; i += 1) {
        if (timezones[i].tzCode === tzCode) {
          gmtValue = timezones[i].offset;
          log.debug(`[${PREFIX}] gmtValue: ${gmtValue}`);
        }
      }
      // get the user's timezone from the database
      const timestring = new Date().toLocaleTimeString('en-US', {timeZone: tzCode});
      return `It is likely ${timestring} (GMT${gmtValue})`;
    } else {
      log.debug(`[${PREFIX}] tzCode is empty!`);
      response = ``;
    }
  }
  return response;
};
