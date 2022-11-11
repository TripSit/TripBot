/* eslint-disable max-len */
import {parse} from 'path';
const PREFIX = parse(__filename).name;
import log from '../utils/logger';

/**
 *
 * @return {inviteInfo}
 */
export async function invite():Promise<inviteInfo> {
  const inviteInfo = {
    bot: 'https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=18432&scope=bot%20applications.commands',
    discord: 'https://discord.gg/TripSit',
  };
  log.info(`[${PREFIX}] response: ${JSON.stringify(inviteInfo, null, 2)}`);
  return inviteInfo;
};

type inviteInfo = {
  bot: string;
  discord: string;
}
