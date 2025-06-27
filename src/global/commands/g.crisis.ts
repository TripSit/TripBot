const F = f(__filename);

export default crisis;

/**
 * Information about contacting the team!
 * @return {any} an object with information about the bot
 */
export async function crisis():Promise<HelpResource[]> {
  const response = [
    {
      name: 'Poison Control',
      country: 'USA',
      website: 'https://www.poison.org',
      phone: '(800) 222-1222',
      text: '',
      webchat: 'https://triage.webpoisoncontrol.org',
    },
    {
      name: 'Never Use Alone',
      country: 'USA',
      website: 'https://neverusealone.com',
      phone: '(800) 484-3731',
      text: '',
      webchat: '',
    },
    {
      name: 'National Overdose Response Service',
      country: 'Canada',
      website: 'https://www.nors.ca',
      phone: '1 (888) 688-6677',
      text: '',
      webchat: '',
    },
    {
      name: 'BuddyUp',
      country: 'UK',
      website: 'https://cranstoun.org/help-and-advice/harm-reduction/buddyup/',
      phone: '',
      text: '[🍎](https://apps.apple.com/gb/app/buddyup-with-cranstoun/id1601622050) [🤖](https://play.google.com/store/apps/details?id=org.cranstoun.buddyup)', // eslint-disable-line max-len
      webchat: '',
    },
    {
      name: 'Talktofrank',
      country: 'UK',
      website: 'https://www.talktofrank.com',
      phone: '0300 123 6600',
      text: '',
      webchat: 'https://www.talktofrank.com/livechat',
    },
    {
      name: 'Mindzone',
      country: 'EU/germany',
      website: 'https://mindzone.info/gesundheit/drogennotfall',
      phone: '',
      text: '112 (works EU wide)',
      webchat: '',
    },
    {
      name: 'Crisis Text Line',
      country: 'United States',
      website: 'https://www.crisistextline.org',
      phone: '988',
      text: 'HOME to 741741',
      webchat: '',
    },
    {
      name: 'Canadian Mental Health Association',
      country: 'Canada',
      website: 'https://cmha.ca/',
      phone: `1-833-456-4566 (24/7) 
      1-866-277-3553 in Quebec (24/7) `,
      text: '45645 (4 p.m. – Midnight ET)',
      webchat: '',
    },
    {
      name: 'Kids Help Phone (<18)',
      country: 'Canada',
      website: 'https://kidshelpphone.ca/',
      phone: '',
      text: 'CONNECT to 686868',
      webchat: 'https://kidshelpphone.ca/live-chat-counselling/',
    },
    {
      name: 'Samaritans',
      country: 'UK',
      website: 'https://www.samaritans.org',
      phone: '116 123',
      text: '',
      webchat: 'https://www.samaritans.org/how-we-can-help/contact-samaritan/',
    },
    {
      name: 'Open Counseling Suicide Hotline List',
      country: 'Worldwide',
      website: 'https://blog.opencounseling.com/suicide-hotlines/',
      phone: '',
      text: '',
      webchat: '',
    },
    {
      name: 'Support Center for Adults in Mental Crisis',
      country: 'Poland',
      website: 'https://centrumwsparcia.pl/centrum-wsparcia/',
      phone: '800 70 2222',
      text: '',
      webchat: '',
    },
  ];
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}

type HelpResource = {
  name: string;
  country: string;
  website: string;
  phone: string;
  text: string;
  webchat: string;
};

const template = // eslint-disable-line
{
  name: '',
  country: '',
  website: '',
  phone: '',
  text: '',
  webchat: '',
};
