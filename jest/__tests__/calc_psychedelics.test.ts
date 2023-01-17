import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dCalcpsychedelics } from '../../src/discord/commands/global/d.calcPsychedelics';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dCalcpsychedelics;

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
        `/${slashCommand.data.name} lsd last_dose:300 days:3 desired_dose:400`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title: '634 ug of LSD is needed to feel the same effects as 400 ug of LSD when 300 ug were taken 3 days ago.',
        description: stripIndents`
          This ESTIMATE only works for tryptamines (LSD and Magic Mushrooms).
          As all bodies and brains are different, results may vary. 
          [Credit to cyberoxide's Codepen](https://codepen.io/cyberoxide/pen/BaNarGd) and [AdmiralAcid's post on reddit](https://www.reddit.com/r/LSD/comments/4dzh9s/lsd_tolerance_calculator_improved/) 
        `,
      }),
    });
  });
});
