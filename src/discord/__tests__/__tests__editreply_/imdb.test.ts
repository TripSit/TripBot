/* eslint-disable max-len */
import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { stripIndents } from 'common-tags';
// import * as imdbApi from 'imdb-api';
import { dAbout } from '../../commands/global/d.about';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../../../../jest/utils/testutils';

import log from '../../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dAbout;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    // jest.spyOn(imdbApi, 'get').mockResolvedValue({
    //   ratings: [
    //     {
    //       source: 'Internet Movie Database',
    //       value: '7.8/10',
    //     },
    //   ],
    //   title: 'Jurrassic Park',
    //   year: 2020,
    //   rated: 'N/A',
    //   released: new Date('2020-01-01'),
    //   runtime: '14 min',
    //   genres: 'Short, Comedy',
    //   director: 'Jordan Miley-Dingler',
    //   writer: 'Jordan Miley-Dingler, Earl Ricci',
    //   actors: 'Christian Ashe, Nino Broadnax, Gavyn Dean',
    //   plot: "A dinosaur expert (Nino Broadnax) is digging at a dig site when he is approached by a eccentric billionaire (Gavyn Dean) and taken to a park with dinosaurs. Gavyn leaves to get a man named Gilberto (Gilberto Medina-Ozuna) who likes dinosaurs, chicken nuggets, and dinosaur chicken nuggets. They go inside a facility to meet the person who makes the dinosaurs. When entering his lab, Gilberto is instantly amazing by the scientist's (Cameron Holder) equations. Nino talks to the scientist who recalls creating his first dinosaur and how it escapes. He then recalls making a second dinosaur, to hunt down the first one. The scientist then decides to go find his two escaped creations, and Nino decides to follow with Gavyn and Gilberto following suit. Once leaving the facility, the group instantly is greeted to a seen of the older dinosaur eating a dead person (Eduardo Lira) and the newer dinosaur hunting it. They battle, and the newer dinosaur kills the older one. Gilberto runs to save the older one, yelling \"The precious DNA!\" and the scientist chases him, claiming he will die. The dinosaur kills them both, and Nino and Gavyn run away. After some chasing and two fake endings, one with a secret plan to kill the pair and another with voodoo zombies and time travel, the true ending is revealed and the pair leave the park.", // eslint-disable-line
    //   languages: 'English',
    //   country: 'United States',
    //   awards: 'N/A',
    //   poster: 'N/A',
    //   metascore: 'N/A',
    //   rating: 7.8,
    //   votes: '31',
    //   imdbid: 'tt12176466',
    //   type: 'movie',
    //   boxoffice: 'N/A',
    //   production: 'N/A',
    //   website: 'N/A',
    //   name: 'Jurrassic Park',
    //   series: false,
    //   imdburl: 'https://www.imdb.com/title/tt12176466',
    // } as imdbApi.Movie);
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name} title:Jurrassic Park`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyEditReply(slashCommand, command);
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
      title: 'Bot Stats',
      url: 'https://tripsit.me/about/',
      description: stripIndents`Description`,
      fields: [
        {
          name: 'Name',
          value: stripIndents`Value`,
          inline: true,
        },
      ],
    }));
  });
});
