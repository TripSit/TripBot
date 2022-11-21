import { Colors } from 'discord.js';
import { parse } from 'path';
import { dAbout } from '../../discord/commands/global/d.about';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

describe('AboutCommand', () => {
  it('replies with about message embed', async () => {
    const commandData = dAbout.data;
    const stringCommand = '/about';
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(dAbout, command);
    expect(spy).toHaveBeenCalledWith(embedContaining({
      color: Colors.DarkBlue,
      title: 'About TripBot',
      url: 'https://tripsit.me/about/',
      description: 'test',
    }));
  });
});
