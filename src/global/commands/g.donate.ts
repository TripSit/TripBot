/**
 * Information about contacting the team!
 * @return {any} an object with information about the bot
 */
export async function donate():Promise<donateResource[]> {
  return [
    {
      name: 'Patreon (Preferred)',
      value: 'https://patreon.com/tripsit',
    },
    {
      name: 'Discord Boosts',
      value: 'http://discord.gg/TripSit',
    },
    {
      name: '\u200B',
      value: '\u200B',
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
};

type donateResource = {
  name: string;
  value: string;
}

const template = // eslint-disable-line
{
  name: '',
  value: '',
}
;
