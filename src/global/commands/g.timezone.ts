/* eslint-disable max-len */

import timezones from '../assets/data/timezones.json';
import { getUser, usersUpdate } from '../utils/knex';

const F = f(__filename);

export default timezone;

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
  tzvalue?:string | null,
):Promise<string | null> {
  // log.debug(F, `tzvalue: ${command} ${memberId} ${tzvalue}`);

  let response = '' as string | null;
  if (command === 'set') {
    // define offset as the value from the timezones array
    let tzCode = '';
    for (const zone of timezones) { // eslint-disable-line no-restricted-syntax
      if (zone.label === tzvalue) {
        tzCode = zone.tzCode;
        // log.debug(F, `tzCode: ${tzCode}`);
      }
    }
    // log.debug(F, `actor.id: ${actor.id}`);

    const userData = await getUser(memberId, null);

    userData.timezone = tzCode;

    await usersUpdate(userData);

    return `I updated your timezone to ${tzvalue}`;
  }
  let gmtValue = '';

  const userData = await getUser(memberId, null);

  // log.debug(F, `userData: ${JSON.stringify(userData, null, 2)}`);

  if (userData.timezone !== null) {
    const tzCode = userData.timezone;
    for (const zone of timezones) { // eslint-disable-line no-restricted-syntax
      if (zone.tzCode === tzCode) {
        gmtValue = zone.offset;
        // log.debug(F, `gmtValue: ${gmtValue}`);
      }
    }
    // get the user's timezone from the database
    const timestring = new Date().toLocaleTimeString('en-US', { timeZone: tzCode });
    response = `It is likely ${timestring} (GMT${gmtValue})`;
    log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  }
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
