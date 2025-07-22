interface HelpResource {
  country: string;
  description: string;
  name: string;
  website: string;
}

/**
 * Information about contacting the team!
 * @return {any} an object with information about the bot
 */

export default async function testkits(): Promise<HelpResource[]> {
  return [
    {
      country: 'Worldwide',
      description: '[Info on the new test strips](https://dancesafe.org/fentanyl/)',
      name: 'DanceSafe',
      website: 'https://dancesafe.org/product-category/testing-strips/',
    },
    {
      country: 'Europe',
      description: '10% off with code TripSit (Affiliate code)',
      name: 'Protest',
      website: 'https://protestkit.eu/shop/?coupon_code=tripsit',
    },
    {
      country: 'UK & EU',
      description: '10% off with code tripsitwiki',
      name: 'ReagentTests UK',
      website: 'https://www.reagent-tests.uk/shop/',
    },
    {
      country: 'Australia',
      description: '',
      name: 'EZ Test',
      website: 'http://ez-test.com.au/',
    },
    {
      country: 'France',
      description: '',
      name: 'Test Drogue',
      website: 'https://www.testdrogue.fr/',
    },
  ];
}
