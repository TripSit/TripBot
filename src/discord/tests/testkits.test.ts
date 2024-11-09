import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import dTestkits from '../commands/global/d.testkits';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../../jest/utils/testutils';

const slashCommand = dTestkits;

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
        color: Colors.Purple,
        title: 'Test Kit Resources and information!',
        description: stripIndents`
      [How to use a reagent test kit](https://dancesafe.org/testing-kit-instructions/)
      [How to use fentanyl strips](https://dancesafe.org/fentanyl/)
      [More testkit resources on the TripSit wiki!](https://wiki.tripsit.me/wiki/Test_Kits)
      `,
        fields: [
          {
            name: 'DanceSafe (Worldwide)',
            value: stripIndents`
          [Website](https://dancesafe.org/product-category/testing-strips/)            
          [Info on the new test strips](https://dancesafe.org/fentanyl/)`,
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
