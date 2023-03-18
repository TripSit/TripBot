import { stripIndents } from 'common-tags';
import { Colors } from 'discord.js';
import { dBotstats } from '../../src/discord/commands/guild/d.botstats';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dBotstats;

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
        title: 'Bot Stats',
        description: stripIndents`
          Here are some stats about the bot!
          Guilds: 1
          Users: 1
          Channels: 0
          Commands: 79
          Uptime: 0ms
          TS Drug Database Size: 550
          TS+PW Drug Database Size: 591
        `,
      }),
    });
  });
});
