import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { Colors } from 'discord.js';
import { dBotstats } from '../../discord/commands/guild/d.botstats';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dBotstats;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name}`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith(embedContaining({
      author: {
        iconURL: 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png',
        name: 'TripSit.Me',
        url: 'http://www.tripsit.me',
      },
      footer: {
        iconURL: 'https://imgur.com/b923xK2.png',
        text: 'Dose responsibly!',
      },
      color: Colors.Purple,
      title: 'Bot Stats',
      description: stripIndents`
      Here are some stats about the bot!
      Guilds: 1
      Users: 1
      Channels: 1
      Commands: 0
      Uptime: 0ms
    `,
    }));
  });
});
