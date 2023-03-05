/* eslint-disable max-len */

import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dAbout } from '../../src/discord/commands/global/d.about';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dAbout;

const authorInfo = {
  iconURL: 'https://i.gyazo.com/b48b08a853fefaafb6393837eec1a501.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};
const footerInfo = {
  iconURL: 'https://i.gyazo.com/19276c297cca0761dc9689ac7c320b8e.png',
  text: 'Dose responsibly!',
};

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.DarkBlue,
        title: 'About TripBot',
        url: 'https://tripsit.me/about/',
        description: stripIndents`This app is created by TripSit, an organisation which helps to provide factual information        about drugs and how to reduce the harms involved in using them.
              The official support server is [TripSit discord](https://discord.gg/TripSit). If you have issues/questions, join and talk with Moonbear!`,
        fields: [
          {
            name: 'Invite',
            value: stripIndents`[Click here to invite TripBot to your own server](https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=18432&scope=bot%20applications.commands).
                  Note: For advanced features you will need to give the bot more permissions at your discression.`,
          },
          {
            name: 'Disclaimer',
            value: stripIndents`Although we have a team dedicated to keeping the information on this app up to date,        it is not always possible to provide entirely accurate information on the safety        level of drugs. The information here should be used as guidelines only, and it is        important to do your own research from multiple sources before ingesting a substance.
                  We also strongly advise using a testing kit and scales to ensure you are taking the        correct dosage. These can both be bought online for reasonable prices.`,
          },
          {
            name: 'Support TripSit',
            value: stripIndents`TripSit is a completely free service run by volunteers.
                  If you wish to help out, feel free to join the [discord](https://discord.gg/TripSit),        follow and share our content on social media, or make a donation on the [Patreon](https://www.patreon.com/TripSit)!`,
          },
          {
            name: 'Feedback',
            value: stripIndents`We would love to hear your feedback on this bot!
                  Join the [TripSit discord](https://discord.gg/TripSit) and talk with Moonbear!
                  Or use the /bug command and to send a message!`,
          },
          {
            name: 'Credits',
            value: stripIndents`The bot is built using the [Discord.js library](https://discordjs.guide/)
                  A majority of this code is original, and is available on [GitHub](https://github.com/tripsit/tripsit-discord-bot)
                  The data is sourced from the [TripSit and Psychonaut Wiki API combined](https://github.com/NoahSaso/merge-psychonautwiki-tripsit-data)
                  The DXM calculator comes from [Tripsit](https://github.com/TripSit/DXM-Calculator)
                  The Benzo calculator comes from [Tripsit](https://github.com/TripSit/Benzo-Calculator)
                  The Ketamine calculator and pill_id code was inspired by [PsyBot](https://github.com/v0idp/PsyBot)
                  The LSD calculator info was inspired from [this codepen](https://codepen.io/cyberoxide/pen/BaNarGd)
                  The actual [research for the LSD calculator](https://www.reddit.com/r/LSD/comments/4dzh9s/lsd_tolerance_calculator_improved/)`,
          },
        ],
      }),
    });
  });
});
