const F = f(__filename);

export default contact;

/**
 * Information about contacting the team!
 * @return {any} an object with information about the bot
 */
export async function contact():Promise<Contact> {
  const response = {
    name: 'TripSit',
    url: 'https://tripsit.me/contact-us/',
    discord: 'http://discord.gg/TripSit',
    botOwner: 'Moonbear#1024',
    webchat: 'http://chat.tripsit.me',
    botEmail: 'discord@tripsit.me',
    contentEmail: 'content@tripsit.me',
  };
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}

type Contact = {
  name: string;
  url: string;
  discord: string;
  botOwner: string;
  webchat: string;
  botEmail: string;
  contentEmail: string;
};
