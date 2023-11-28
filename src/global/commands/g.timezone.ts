/* eslint-disable max-len */

import timezones from '../assets/data/timezones.json';
import { getUser, usersUpdate } from '../utils/knex';
import { embedTemplate } from '../../discord/utils/embedTemplate';

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
  interaction?:any,
):Promise<string | null> {
  // log.debug(F, `tzvalue: ${command} ${memberId} ${tzvalue}`);

  let response = '' as string | null;
  if (command === 'set') {
    const embed = embedTemplate();
    // define offset as the value from the timezones array
    let tzCode = '';
    for (const zone of timezones) { // eslint-disable-line no-restricted-syntax
      if (zone.label === tzvalue) {
        tzCode = zone.tzCode;
        // log.debug(F, `tzCode: ${tzCode}`);
      }
    }
    if (tzCode === '') {
      embed.setTitle('Invalid timezone!\nPlease only use the options from the autocomplete list.');
      await interaction.editReply({ embeds: [embed] });
      return null;
    }
    // log.debug(F, `actor.id: ${actor.id}`);

    const userData = await getUser(memberId, null, null);

    userData.timezone = tzCode;

    await usersUpdate(userData);

    embed.setTitle(`I updated your timezone to ${tzvalue}`);
    await interaction.editReply({ embeds: [embed] });
    return null;
  }
  let gmtValue = '';

  const userData = await getUser(memberId, null, null);

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
    log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  }
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
