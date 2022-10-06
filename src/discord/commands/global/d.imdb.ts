import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {getImdb} from '../../../global/commands/g.imdb';
import logger from '../../../global/utils/logger';
import * as imdb from 'imdb-api';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const imdbSearch: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('imdb')
    .setDescription('Search imdb')
    .addStringOption((option) => option
      .setName('title')
      .setDescription('Movie / Series title')
      .setRequired(true)),

  async execute(interaction:ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] starting!`);

    const title = interaction.options.getString('title')!;

    const result = await getImdb(title);

    // {
    //   "ratings": [
    //     {
    //       "source": "Internet Movie Database",
    //       "value": "6.9/10"
    //     },
    //     {
    //       "source": "Rotten Tomatoes",
    //       "value": "61%"
    //     },
    //     {
    //       "source": "Metacritic",
    //       "value": "53/100"
    //     }
    //   ],
    //   "title": "A Goofy Movie",
    //   "year": 1995,
    //   "_yearData": "1995",
    //   "rated": "G",
    //   "released": "1995-04-07T05:00:00.000Z",
    //   "runtime": "78 min",
    //   "genres": "Animation, Adventure, Comedy",
    //   "director": "Kevin Lima",
    //   "writer": "Jymn Magon, Chris Matheson, Brian Pimental",
    //   "actors": "Bill Farmer, Jason Marsden, Jim Cummings",
    //   "plot": "",
    //   "languages": "English",
    //   "country": "United States, Australia, France, Canada",
    //   "awards": "5 nominations",
    //   "poster": ".jpg",
    //   "metascore": "53",
    //   "rating": 6.9,
    //   "votes": "54,411",
    //   "imdbid": "tt0113198",
    //   "type": "movie",
    //   "dvd": "2003-06-03T05:00:00.000Z",
    //   "boxoffice": "$35,348,597",
    //   "production": "N/A",
    //   "website": "N/A",
    //   "name": "A Goofy Movie",
    //   "series": false,
    //   "imdburl": "https://www.imdb.com/title/tt0113198"
    // }

    // logger.debug(`[${PREFIX}] data: ${JSON.stringify(result)}`);

    const embed = embedTemplate()
      .setTitle(`${result.title} (${result.year}) [${result.rated}]`)
      .setDescription(`||${result.plot}||`)
      .setThumbnail(result.poster)
      .setURL(result.imdburl)
      .addFields(
        {name: 'Director(s)', value: `${result.director}`, inline: true},
        {name: 'Actor(s)', value: `${result.actors}`, inline: true},
        {name: 'Writer(s)', value: `${result.writer}`, inline: true},
      );

    result.ratings.forEach((rating:imdb.Rating) => {
      embed.addFields({name: rating.source, value: rating.value, inline: true});
    });

    interaction.reply({embeds: [embed], ephemeral: false});

    logger.debug(`[${PREFIX}] finished!`);
  },
};
