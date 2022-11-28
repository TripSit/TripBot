/* eslint-disable max-len */
import { stripIndents } from 'common-tags';
import { parse } from 'path';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default about;

/**
 * Information about the bot!
 * @return {aboutInfo} an object with information about the bot
 */
export async function about():Promise<AboutInfo> {
  const aboutInfo = {
    name: 'TripSit',
    url: 'https://tripsit.me/',
    description: stripIndents`
        This app is created by TripSit, an organisation which helps to provide factual information\
        about drugs and how to reduce the harms involved in using them.
        The official support server is [TripSit discord](https://discord.gg/TripSit). If you have issues/questions, join and talk with Moonbear!
      `,
    invite: stripIndents`
        [Click here to invite TripBot to your own server](https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=18432&scope=bot%20applications.commands).
        Note: For advanced features you will need to give the bot more permissions at your discression.
      `,
    disclaimer: stripIndents`
        Although we have a team dedicated to keeping the information on this app up to date,\
        it is not always possible to provide entirely accurate information on the safety\
        level of drugs. The information here should be used as guidelines only, and it is\
        important to do your own research from multiple sources before ingesting a substance.
        We also strongly advise using a testing kit and scales to ensure you are taking the\
        correct dosage. These can both be bought online for reasonable prices.
      `,
    support: stripIndents`
        TripSit is a completely free service run by volunteers.
        If you wish to help out, feel free to join the [discord](https://discord.gg/TripSit),\
        follow and share our content on social media, or make a donation on the [Patreon](https://www.patreon.com/TripSit)!
      `,
    feedback: stripIndents`
        We would love to hear your feedback on this bot!
        Join the [TripSit discord](https://discord.gg/TripSit) and talk with Moonbear!
        Or use the /bug command and to send a message!
      `,
    credits: stripIndents`
        The bot is built using the [Discord.js library](https://discordjs.guide/)
        A majority of this code is original, and is available on [GitHub](https://github.com/tripsit/tripsit-discord-bot)
        The data is sourced from the [TripSit and Psychonaut Wiki API combined](https://github.com/NoahSaso/merge-psychonautwiki-tripsit-data)
        The DXM calculator comes from [Tripsit](https://github.com/TripSit/DXM-Calculator)
        The Benzo calculator comes from [Tripsit](https://github.com/TripSit/Benzo-Calculator)
        The Ketamine calculator and pill_id code was inspired by [PsyBot](https://github.com/v0idp/PsyBot)
        The LSD calculator info was inspired from [this codepen](https://codepen.io/cyberoxide/pen/BaNarGd)
        The actual [research for the LSD calculator](https://www.reddit.com/r/LSD/comments/4dzh9s/lsd_tolerance_calculator_improved/)
      `,
  };
  log.info(`[${PREFIX}] response: ${JSON.stringify(aboutInfo, null, 2)}`);
  return aboutInfo;
}

type AboutInfo = {
  name: string;
  url: string;
  invite: string;
  description: string;
  disclaimer: string;
  support: string;
  feedback: string;
  credits: string;
};
