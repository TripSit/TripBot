const F = f(__filename);

export default donate;

/**
 * Information about contacting the team!
 * @return {any} an object with information about the bot
 */
export async function donate():Promise<DonateResource[]> {
  const response = [
    {
      name: 'Patreon Subscription',
      value: 'https://patreon.com/tripsit',
    },
    {
      name: 'KoFi Tips',
      value: 'https://ko-fi.com/tripsit',
    },
    {
      name: 'Discord Boosts',
      value: 'http://discord.gg/TripSit',
    },
    {
      name: 'Spreadshop',
      value: 'https://tripsit.myspreadshop.com/',
    },
    {
      name: 'Spreadshirt',
      value: 'https://www.spreadshirt.com/shop/tripsit/',
    },
    {
      name: '\u200B',
      value: '\u200B',
    },
  ];
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}

type DonateResource = {
  name: string;
  value: string;
};

const template = // eslint-disable-line
{
  name: '',
  value: '',
};
