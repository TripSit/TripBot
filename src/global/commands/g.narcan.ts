type HelpResource = {
  name: string;
  country: string;
  website: string;
  description: string;
};

/**
 * Information about where to find naloxone (Narcan)
 * @return {any} an object with information about naloxone access
 */

export default async function naloxone(): Promise<HelpResource[]> {
  return [
    {
      name: 'NEXT Distro',
      // eslint-disable-next-line sonarjs/no-duplicate-string
      country: 'United States',
      website: 'https://nextdistro.org/naloxone',
      description: 'Free naloxone mailed nationwide; eligibility varies by state',
    },
    {
      name: 'Naloxone Finder (NHRC)',
      country: 'United States',
      website: 'https://harmreduction.org/resource-center/harm-reduction-near-you/',
      description: 'Map of local pickup sites',
    },
    {
      name: 'Pharmacy (OTC)',
      country: 'United States',
      website: '',
      description: 'Narcan available without a prescription',
    },
    {
      name: 'Pharmacy (OTC)',
      country: 'Canada',
      website: '',
      description: 'Available at pharmacies without a prescription in every province',
    },
    {
      name: 'Take Home Naloxone Program',
      country: 'Australia',
      website: '',
      description: 'Free nationally at participating pharmacies, no prescription needed',
    },
    {
      name: 'Drug consumption rooms & pharmacies',
      country: 'Germany',
      website: '',
      description: 'distributed via DCRs and OTC in pharmacies',
    },
    {
      name: 'Ask the community',
      country: 'Other',
      website: '',
      description: 'Coverage varies widely. Check #hr-resources or ask the people',
    },
  ];
}
