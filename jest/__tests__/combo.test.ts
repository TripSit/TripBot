import { stripIndents } from 'common-tags';
import { Colors } from 'discord.js';
import { dCombo } from '../../src/discord/commands/global/d.combo';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dCombo;

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
        `/${slashCommand.data.name} first_drug:MDMA second_drug:Ketamine`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: 2123412,
        author: authorInfo,
        footer: footerInfo,
        thumbnail: {
          url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/up-right-arrow_2197-fe0f.png', // eslint-disable-line
        },
        title: 'Mixing **MDMA** and **Ketamine**: ↗ Low Risk & Synergy ↗',
          description: stripIndents`These drugs work together to cause an effect greater than the sum of its parts, and they aren't likely to cause an adverse or undesirable reaction when used carefully. Additional research should always be done before combining drugs.`, // eslint-disable-line
      }),
    });
  });
});
