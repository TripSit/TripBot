const F = f(__filename);

export default warmline;

/**
 * Information about contacting the team!
 * @return {any} an object with information about the bot
 */
export async function warmline():Promise<HelpResource[]> {
  const resources = [
    {
      name: 'Warmline Directory',
      country: 'US',
      website: 'https://warmline.org/warmdir.html#directory',
      phone: '',
      text: '',
      webchat: '',
    },
    {
      name: 'Progress Place',
      country: 'Canada',
      website: 'https://www.warmline.ca/',
      phone: '416-960-WARM (9276)',
      text: '647-557-5882',
      webchat: '',
    },
  ];
  log.info(F, `response: ${JSON.stringify(resources, null, 2)}`);
  return resources;
}

type HelpResource = {
  name: string;
  country: string;
  website: string;
  phone: string;
  text: string;
  webchat: string;
};
