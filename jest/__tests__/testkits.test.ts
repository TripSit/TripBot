import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dTestkits } from '../../src/discord/commands/global/d.testkits';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dTestkits;

const authorInfo = {
  iconURL: 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};
const footerInfo = {
  iconURL: 'https://imgur.com/b923xK2.png',
  text: 'Dose responsibly!',
};

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyReply(
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
        color: Colors.Purple,
        title: 'Test Kit Resources and information!',
        description: stripIndents`
      [How to use a reagent test kit](https://dancesafe.org/testing-kit-instructions/)
      [How to use fent strips](https://dancesafe.org/you-may-be-using-fentanyl-testing-strips-incorrectly/)
      [More testkit resources on the TripSit wiki!](https://wiki.tripsit.me/wiki/Test_Kits)
      `,
        fields: [
          {
            name: 'Dosetest (Worldwide)',
            value: stripIndents`
          [Website](https://dosetest.com/)            
          20% off test kits with code TripSit!`,
            inline: true,
          },
          {
            name: 'ReagentTests UK (UK & EU)',
            value: stripIndents`
          [Website](https://www.reagent-tests.uk/shop/)            
          10% off with code tripsitwiki!`,
            inline: true,
          },
        ],
      }),
    });
  });
});
