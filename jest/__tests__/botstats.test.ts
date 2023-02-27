import { stripIndents } from 'common-tags';
import { Colors } from 'discord.js';
import { dBotstats } from '../../src/discord/commands/guild/d.botstats';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dBotstats;

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
        title: 'Bot Stats',
        description: stripIndents`
          Here are some stats about the bot!
          Guilds: 1
          Users: 1
          Channels: 0
          Commands: 0
          Uptime: 0ms
        `,
      }),
      ephemeral: false,
    });
  });
});
