/* eslint-disable max-len */
import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { dAbout } from '../../../src/discord/commands/global/d.about';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../../utils/testutils';

const slashCommand = dAbout;

const authorInfo = {
  iconURL: 'https://i.gyazo.com/b48b08a853fefaafb6393837eec1a501.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};
const footerInfo = {
  iconURL: 'https://i.gyazo.com/19276c297cca0761dc9689ac7c320b8e.png',
  text: 'Dose responsibly!',
};

let mock = {} as MockAdapter;

beforeAll(() => {
  mock = new MockAdapter(axios);
});

afterEach(() => {
  mock.reset();
});

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    mock.onGet('URL')
      .reply(200, [
        {
          response: '',
        },
      ]);

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
        color: Colors.DarkBlue,
        title: 'About TripBot',
        url: 'https://tripsit.me/about/',
        description: stripIndents``,
        image: {
          url: 'imgur',
        },
        fields: [
          {
            name: 'name',
            value: stripIndents`desc`,
            inline: true,
          },
        ],
      }),
    });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: stripIndents`This command can only be used in a discord guild!` });
  });
});
