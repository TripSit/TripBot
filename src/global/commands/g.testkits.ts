/* eslint-disable max-len */

/**
 * Information about contacting the team!
 * @return {any} an object with information about the bot
 */
export async function testkits():Promise<helpResource[]> {
  return [
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
