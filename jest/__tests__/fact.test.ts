/* eslint-disable max-len */

import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { dFact } from '../../src/discord/commands/global/d.fact';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dFact;

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
    mock.onGet('https://facts-by-api-ninjas.p.rapidapi.com/v1/facts')
      .reply(200, [
        {
          fact: 'To make one pound of whole milk cheese, 10 pounds of whole milk is needed',
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
        color: Colors.Purple,
        title: stripIndents`To make one pound of whole milk cheese, 10 pounds of whole milk is needed`,
      }),
    });
  });
});
