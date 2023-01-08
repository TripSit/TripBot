import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { dCombo } from '../../src/discord/commands/global/d.combo';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';
import log from '../../src/global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dCombo;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name} first_drug:MDMA second_drug:Ketamine`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: 2123412,
        author: {
          iconURL: 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png',
          name: 'TripSit.Me',
          url: 'http://www.tripsit.me',
        },
        footer: {
          iconURL: 'https://imgur.com/b923xK2.png',
          text: 'Dose responsibly!',
        },
        thumbnail: {
        url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/samsung/320/up-right-arrow_2197-fe0f.png', // eslint-disable-line
        },
        title: 'Mixing **MDMA** and **Ketamine**: ↗ Low Risk & Synergy ↗',
      description: stripIndents`These drugs work together to cause an effect greater than the sum of its parts, and they aren't likely to cause an adverse or undesirable reaction when used carefully. Additional research should always be done before combining drugs.`, // eslint-disable-line
      }),
    });
  });
});
