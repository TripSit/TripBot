const F = f(__filename);

export default crisis;

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
export async function crisis(): Promise<HelpResource[]> {
  const response = [
    {
      country: 'USA',
      name: 'Poison Control',
      phone: '(800) 222-1222',
      text: '',
      webchat: 'https://triage.webpoisoncontrol.org',
      website: 'https://www.poison.org',
    },
    {
      country: 'USA',
      name: 'Never Use Alone',
      phone: '(800) 484-3731',
      text: '',
      webchat: '',
      website: 'https://neverusealone.com',
    },
    {
      country: 'Canada',
      name: 'National Overdose Response Service',
      phone: '1 (888) 688-6677',
      text: '',
      webchat: '',
      website: 'https://www.nors.ca',
    },
    {
      country: 'UK',
      name: 'BuddyUp',
      phone: '',
      text: '[🍎](https://apps.apple.com/gb/app/buddyup-with-cranstoun/id1601622050) [🤖](https://play.google.com/store/apps/details?id=org.cranstoun.buddyup)',
      webchat: '',
      website: 'https://cranstoun.org/help-and-advice/harm-reduction/buddyup/',
    },
    {
      country: 'UK',
      name: 'Talktofrank',
      phone: '0300 123 6600',
      text: '',
      webchat: 'https://www.talktofrank.com/livechat',
      website: 'https://www.talktofrank.com',
    },
    {
      country: 'EU/germany',
      name: 'Mindzone',
      phone: '',
      text: '112 (works EU wide)',
      webchat: '',
      website: 'https://mindzone.info/gesundheit/drogennotfall',
    },
    {
      country: 'United States',
      name: 'Crisis Text Line',
      phone: '988',
      text: 'HOME to 741741',
      webchat: '',
      website: 'https://www.crisistextline.org',
    },
    {
      country: 'Canada',
      name: 'Canadian Mental Health Association',
      phone: `1-833-456-4566 (24/7) 
      1-866-277-3553 in Quebec (24/7) `,
      text: '45645 (4 p.m. – Midnight ET)',
      webchat: '',
      website: 'https://cmha.ca/',
    },
    {
      country: 'Canada',
      name: 'Kids Help Phone (<18)',
      phone: '',
      text: 'CONNECT to 686868',
      webchat: 'https://kidshelpphone.ca/live-chat-counselling/',
      website: 'https://kidshelpphone.ca/',
    },
    {
      country: 'UK',
      name: 'Samaritans',
      phone: '116 123',
      text: '',
      webchat: 'https://www.samaritans.org/how-we-can-help/contact-samaritan/',
      website: 'https://www.samaritans.org',
    },
    {
      country: 'Worldwide',
      name: 'Open Counseling Suicide Hotline List',
      phone: '',
      text: '',
      webchat: '',
      website: 'https://blog.opencounseling.com/suicide-hotlines/',
    },
    {
      country: 'Poland',
      name: 'Support Center for Adults in Mental Crisis',
      phone: '800 70 2222',
      text: '',
      webchat: '',
      website: 'https://centrumwsparcia.pl/centrum-wsparcia/',
    },
  ];
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}

const template = // eslint-disable-line
  {
    country: '',
    name: '',
    phone: '',
    text: '',
    webchat: '',
    website: '',
  };
