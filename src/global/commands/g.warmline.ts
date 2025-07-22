const F = f(__filename);

export default warmline;

interface HelpResource {
  country: string;
  name: string;
  phone: string;
  text: string;
  webchat: string;
  website: string;
}

/**
 * Information about contacting the team!
 * @return {any} an object with information about the bot
 */
export async function warmline(): Promise<HelpResource[]> {
  const resources = [
    {
      country: 'US',
      name: 'Warmline Directory',
      phone: '',
      text: '',
      webchat: '',
      website: 'https://warmline.org/warmdir.html#directory',
    },
    {
      country: 'Canada',
      name: 'Progress Place',
      phone: '416-960-WARM (9276)',
      text: '647-557-5882',
      webchat: '',
      website: 'https://www.warmline.ca/',
    },
  ];
  log.info(F, `response: ${JSON.stringify(resources, null, 2)}`);
  return resources;
}
