import {
  Colors,
} from 'discord.js';
import axios from 'axios';
import { dJoke } from '../../src/discord/commands/global/d.joke';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dJoke;

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
    jest.spyOn(axios, 'get').mockResolvedValue({
      data: {
        type: 'single',
        joke: 'What do you call a fake noodle? An impasta.',
        flags: {
          nsfw: false,
          religious: false,
          political: false,
        },
      },
    });
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
        title: 'What do you call a fake noodle? An impasta.',
      }),
      ephemeral: false,
    });
  });
});
