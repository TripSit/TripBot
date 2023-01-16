import { Colors } from 'discord.js';
import { dAvatar } from '../../src/discord/commands/global/d.avatar';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const F = f(__filename); // eslint-disable-line

const slashCommand = dAvatar;

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
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name} user:@MoonBear#1024`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(F, `command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title: 'nick\'s Profile Picture',
        image: {
          url: 'https://cdn.discordapp.com/avatars/123456789/user%20avatar%20url.webp?size=4096',
        },
      }),
    });
  });
});
