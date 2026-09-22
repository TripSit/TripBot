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
      name: 'Naloxone Finder (NHRC) / Pharmacy (OTC)',
      country: 'United States',
      website: 'https://harmreduction.org/resource-center/harm-reduction-near-you/',
      description: 'Map of local pickup sites; Or available OTC in most states',
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
      name: 'Drug consumption rooms & Online',
      country: 'Germany',
      website: '',
      description: 'distributed via DCRs and can be ordered online as "Ventizolve"',
    },
    {
      name: 'Antidote DK',
      country: 'Denmark',
      website: 'https://antidote.dk/',
      description: 'Free naloxone nasal spray and training via volunteer-run courses nationwide or OTC in pharmacies',
    },
    {
      name: 'Naloxone.fr',
      country: 'France',
      website: 'https://naloxone.fr/',
      description:
    'Naloxone is available without a prescription in pharmacies and free through CAARUD/CSAPA services',
    },
    {
      name: 'Plan Nacional sobre Drogas',
      country: 'Spain',
      website: 'https://pnsd.sanidad.gob.es/',
      description:
      'Naloxone is distributed through overdose-prevention and harm-reduction programs.',
    },
    {
      name: 'Ask the community',
      country: '',
      website: '',
      description: 'Coverage varies widely. Check #hr-resources or ask the people',
    },
  ];
}
