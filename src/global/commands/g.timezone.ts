import timezones from '../../../assets/data/timezones.json';

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
  tzvalue?: null | string,
): Promise<string> {
  // log.debug(F, `tzvalue: ${command} ${memberId} ${tzvalue}`);

  let response = '' as string;
  if (command === 'set') {
    // define offset as the value from the timezones array
    let tzCode = '';
    for (const zone of timezones) {
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
      create: {
        discord_id: memberId,
      },
      update: {},
      where: {
        discord_id: memberId,
      },
    });

    userData.timezone = tzCode;

    await db.users.update({
      data: {
        timezone: tzCode,
      },
      where: {
        discord_id: memberId,
      },
    });

    await db.users.update({
      data: {
        timezone: tzCode,
      },
      where: {
        discord_id: memberId,
      },
    });

    // embed.setTitle(`I updated your timezone to ${tzvalue}`);
    return 'updated';
  }
  let gmtValue = '';

  const userData = await db.users.upsert({
    create: {
      discord_id: memberId,
    },
    update: {},
    where: {
      discord_id: memberId,
    },
  });

  // log.debug(F, `userData: ${JSON.stringify(userData, null, 2)}`);

  if (userData.timezone !== null) {
    const tzCode = userData.timezone;
    for (const zone of timezones) {
      if (zone.tzCode === tzCode) {
        gmtValue = zone.offset;
        // log.debug(F, `gmtValue: ${gmtValue}`);
      }
    }
    // get the user's timezone from the database
    const timestring = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tzCode,
    });
    response = `It's ${timestring} (GMT${gmtValue})`;
  }
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
