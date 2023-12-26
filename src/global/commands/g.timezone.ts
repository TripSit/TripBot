/* eslint-disable max-len */

import { PrismaClient } from '@prisma/client';
import timezones from '../../../assets/data/timezones.json';

const db = new PrismaClient({ log: ['error'] });

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
  // log.debug(F, `tzvalue: ${command} ${memberId} ${tzvalue}`);

  let response = '' as string;
  if (command === 'set') {
    // define offset as the value from the timezones array
    let tzCode = '';
    for (const zone of timezones) { // eslint-disable-line no-restricted-syntax
      if (zone.label === tzvalue) {
        tzCode = zone.tzCode;
        // log.debug(F, `tzCode: ${tzCode}`);
      }
    }
    if (tzCode === '') {
      // embed.setTitle('Invalid timezone!\nPlease only use the options from the autocomplete list.');
      return 'invalid';
    }
    // log.debug(F, `actor.id: ${actor.id}`);

    const userData = await db.users.upsert({
      where: {
        discord_id: memberId,
      },
      create: {
        discord_id: memberId,
      },
      update: {},
    });

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

    // embed.setTitle(`I updated your timezone to ${tzvalue}`);
    return 'updated';
  }
  let gmtValue = '';

  const userData = await db.users.upsert({
    where: {
      discord_id: memberId,
    },
    create: {
      discord_id: memberId,
    },
    update: {},
  });

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
    const timestring = new Date().toLocaleTimeString('en-US', { timeZone: tzCode, hour: '2-digit', minute: '2-digit' });
    response = `It's ${timestring} (GMT${gmtValue})`;
  }
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
