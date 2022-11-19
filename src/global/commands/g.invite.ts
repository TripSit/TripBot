/* eslint-disable max-len */
import { parse } from 'path';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default invite;

/**
 *
 * @return {inviteInfo}
 */
export async function invite():Promise<InviteInfo> {
  const inviteInfo = {
    bot: 'https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=18432&scope=bot%20applications.commands',
    discord: 'https://discord.gg/TripSit',
  };
  log.info(`[${PREFIX}] response: ${JSON.stringify(inviteInfo, null, 2)}`);
  return inviteInfo;
}

type InviteInfo = {
  bot: string;
  discord: string;
};
