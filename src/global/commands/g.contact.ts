import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 * Information about contacting the team!
 * @return {any} an object with information about the bot
 */
export async function contact():Promise<any> {
  const response = {
    name: 'TripSit',
    url: 'https://tripsit.me/contact-us/',
    discord: 'http://discord.gg/TripSit',
    botOwner: 'Moonbear#1024',
    webchat: 'http://chat.tripsit.me',
    botEmail: 'discord@tripsit.me',
    contentEmail: 'content@tripsit.me',
  };
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
};
