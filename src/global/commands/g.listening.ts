import { getUser } from '../utils/knex';
import { Users } from '../@types/database.d';

const F = f(__filename);

export default listerning;

/**
 *
 * @param {string} memberId
 * @return {any} an object with information about the bot
 */
export async function listerning(
  memberId: string,
):Promise<Users> {
  if (!process.env.LAST_FM_APIKEY) {
    log.warn(F, 'Missing LAST_FM_APIKEY: You wont be able to use /listerning');
  }
  const userData = await getUser(memberId, null);

  const lfmnp = require('QuickLastFMNowPlaying');

  const c = new lfmnp.QuickLastFMNowPlaying({
    api_key: process.env.LAST_FM_APIKEY,
    user: lfmnp(),
  });

  c.on('error', e => {
    console.error(e);
  }).on('warning', e => {
    console.error('Got a', e.code, e.body);
  }).on('song', s => {
    console.log('song', s.name, 'by', s.artist['#text']);
  }).on('always', s => {
    console.log('always', s);
  });

  log.info(F, `listerning: ${JSON.stringify(userData, null, 2)}`);
  return userData;
}
