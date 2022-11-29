import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import axios from 'axios';
import { dJoke } from '../../src/discord/commands/global/d.joke';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';
import log from '../../src/global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dJoke;

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
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name}`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
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
      title: 'What do you call a fake noodle? An impasta.',
      // description: '{data.delivery}',
    }));
  });
});
