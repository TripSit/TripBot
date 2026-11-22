/* eslint-disable max-len */

import timezones from '../../../assets/data/timezones.json';
import { getOrCreateUser } from '../utils/dbRecords';

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
):Promise<string> {
  let response = '' as string;
  if (command === 'set') {
    // define offset as the value from the timezones array
    let tzCode = '';
    for (const zone of timezones) { // eslint-disable-line no-restricted-syntax
      if (zone.label === tzvalue) {
        tzCode = zone.tzCode;
      }
    }
    if (tzCode === '') {
      return 'invalid';
    }

    const userData = await getOrCreateUser(memberId);

    userData.timezone = tzCode;

    await db.users.update({
      where: {
        discord_id: memberId,
      },
      data: {
        timezone: tzCode,
      },
    });

    await db.users.update({
      where: {
        discord_id: memberId,
      },
      data: {
        timezone: tzCode,
      },
    });

    return 'updated';
  }
  const userData = await getOrCreateUser(memberId);

  if (userData.timezone !== null) {
    const tzCode = userData.timezone;
    const now = new Date();
    // The time and the offset come from the same formatter and date, so daylight saving applies to both
    const timestring = now.toLocaleTimeString('en-US', { timeZone: tzCode, hour: '2-digit', minute: '2-digit' });
    // Formats like '7/15/2026, GMT-04:00', or a bare 'GMT' for UTC
    const offset = new Intl.DateTimeFormat('en-US', { timeZone: tzCode, timeZoneName: 'longOffset' })
      .format(now).split('GMT')[1] || '+00:00';
    response = `It's ${timestring} (GMT${offset})`;
  }
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
