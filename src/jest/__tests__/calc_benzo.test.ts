import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { dCalcbenzo } from '../../discord/commands/global/d.calcBenzo';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dCalcbenzo;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name} i_have:12.3 mg_of:bromazepam and_i_want_the_dose_of:clobazam`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] getParsedCommand: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith(embedContaining({
      color: Colors.Purple,
      author: {
        iconURL: 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png',
        name: 'TripSit.Me',
        url: 'http://www.tripsit.me',
      },
      footer: {
        iconURL: 'https://imgur.com/b923xK2.png',
        text: 'Dose responsibly!',
      },
      title: '12.3 mg of bromazepam about equal to 49.2 mg of clobazam',
      description: stripIndents`**Please make sure to research the substances thoroughly before using them.**
      It's a good idea to start with a lower dose than the calculator shows, since everybody can react differently to different substances.`, // eslint-disable-line

    }));
  });
});
