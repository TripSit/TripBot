type HelpResource = {
  name: string;
  country: string;
  website: string;
  description: string;
};

/**
 * Information about contacting the team!
 * @return {any} an object with information about the bot
 */

export default async function testkits():Promise<HelpResource[]> {
  return [
    {
      name: 'DanceSafe',
      country: 'Worldwide',
      website: 'https://dancesafe.org/product-category/testing-strips/',
      description: '[Info on the new test strips](https://dancesafe.org/fentanyl/)',
    },
    {
      name: 'Dosetest',
      country: 'Worldwide',
      website: 'https://dosetest.com/tripsit',
      description: '20% off with code TripSit (Affiliate link)',
    },
    {
      name: 'Protest',
      country: 'Europe',
      website: 'https://protestkit.eu/shop/?coupon_code=tripsit',
      description: '10% off with code TripSit (Affiliate code)',
    },
    {
      name: 'ReagentTests UK',
      country: 'UK & EU',
      website: 'https://www.reagent-tests.uk/shop/',
      description: '10% off with code tripsitwiki',
    },
    {
      name: 'EZ Test',
      country: 'Australia',
      website: 'http://ez-test.com.au/',
      description: '10% off with TripsitAusOct\n15% off with TripsitAusNov',
    },
    {
      name: 'Test Drogue',
      country: 'France',
      website: 'https://www.testdrogue.fr/',
      description: '',
    },
  ];
}
