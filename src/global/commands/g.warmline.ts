import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;
/**
 * Information about contacting the team!
 * @return {any} an object with information about the bot
 */
export async function warmline():Promise<helpResource[]> {
  const resources = [
    {
      name: 'Warmline Directory',
      country: 'Worldwide',
      website: 'https://warmline.org/warmdir.html#directory',
      phone: '',
      text: '',
      webchat: '',
    },
  ];
  log.info(`[${PREFIX}] response: ${JSON.stringify(resources, null, 2)}`);
  return resources;
};


type helpResource = {
  name: string;
  country: string;
  website: string;
  phone: string;
  text: string;
  webchat: string;
}
