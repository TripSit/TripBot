/**
 * Information about contacting the team!
 * @return {any} an object with information about the bot
 */
export async function warmline():Promise<helpResource[]> {
  return [
    {
      name: 'Warmline Directory',
      country: 'Worldwide',
      website: 'https://warmline.org/warmdir.html#directory',
      phone: '',
      text: '',
      webchat: '',
    },
  ];
};


type helpResource = {
  name: string;
  country: string;
  website: string;
  phone: string;
  text: string;
  webchat: string;
}

const template = // eslint-disable-line
{
  name: '',
  country: '',
  website: '',
  phone: '',
  text: '',
  webchat: '',
}
;
