import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { dConvert } from '../../src/discord/commands/global/d.convert';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';
import log from '../../src/global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dConvert;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name} value:123456 units:ft-us into:km`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith({
      embeds: embedContaining({
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
        title: '123456 ft-us is 37.62946285463479 km',
      }),
    });
  });
});
