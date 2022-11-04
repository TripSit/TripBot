/* eslint-disable max-len */
import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 * Information about contacting the team!
 * @return {any} an object with information about the bot
 */
export async function testkits():Promise<helpResource[]> {
  const response = [
    {
      name: 'Dosetest',
      country: 'Worldwide',
      website: 'https://dosetest.com/',
      description: '20% off test kits with code TripSit!',
    },
    {
      name: 'ReagentTests UK',
      country: 'UK & EU',
      website: 'https://www.reagent-tests.uk/shop/',
      description: '10% off with code tripsitwiki!',
    },
  ];
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);

  return response;
};

type helpResource = {
  name: string;
  country: string;
  website: string;
  description: string;
}

const template = // eslint-disable-line
{
  name: '',
  country: '',
  website: '',
  description: '',
}
;
