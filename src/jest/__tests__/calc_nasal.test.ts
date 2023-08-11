import {
  Colors,
} from 'discord.js';
import { dCalcNasal } from '../../discord/commands/global/d.calcNasal';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dCalcNasal;

const authorInfo = {
  iconURL: 'https://i.gyazo.com/b48b08a853fefaafb6393837eec1a501.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};
const footerInfo = {
  iconURL: 'https://i.gyazo.com/19276c297cca0761dc9689ac7c320b8e.png',
  text: 'Dose responsibly!',
};

const imageUrl = 'https://user-images.githubusercontent.com/1836049/218758611-c84f1e34-0f5b-43ac-90da-bd89b028f131.png';

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} substance solvent_amount:12 desired_mg_per_push:10 ml_per_push:1.5`,
        slashCommand.data,
        'guild',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title: 'Nasal spray calculator',
        image: {
          url: imageUrl,
        },
        description: 'You\'ll need ~80mg of the substance',
      }),
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} solvent substance_amount:13 desired_mg_per_push:15 ml_per_push:7`,
        slashCommand.data,
        'guild',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title: 'Nasal spray calculator',
        image: {
          url: imageUrl,
        },
        description: 'You\'ll need ~6.07ml of solvent (water)',
      }),
    });
  });
});
