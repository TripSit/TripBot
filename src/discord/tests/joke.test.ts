import {
  Colors,
} from 'discord.js';
import axios from 'axios';
import { dJoke } from '../commands/global/d.joke';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../../jest/utils/testutils';

const slashCommand = dJoke;

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
        title: 'What do you call a fake noodle? An impasta.',
      }),
    });
  });
});
