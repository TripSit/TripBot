/* eslint-disable no-unused-vars */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js';

import {
  ApplicationCommandType,
  ChannelType,
  ButtonStyle,
  TextInputStyle,
} from 'discord-api-types/v10';

import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {stripIndents} from 'common-tags';
import {globalTemplate} from '../../../global/commands/_g.template';
import env from '../../../global/utils/env.config';

import imdb from 'imdb-api';
const imdbClient = new imdb.Client({apiKey: env.IMDB_TOKEN});
import logger from '../../../global/utils/logger';

const PREFIX = require('path').parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('imdb')
      .setDescription('Search imdb')
      .addStringOption((option) => option
          .setName('title')
          .setDescription('Movie / Series title')
          .setRequired(true)),

  async execute(interaction:ChatInputCommandInteraction) {
    logger.debug(`[${PREFIX}] starting!`);

    const title = interaction.options.getString('title');

    imdbClient.get({name: `${title}`}).then(async (result) => {
      const embed = embedTemplate()
          .setTitle(`${result.title} (${result.year})`)
          .setImage(result.poster)
          .setURL(result.imdburl)
          .addFields(
              {name: 'Title', value: `${result.title}`},
              {name: 'Year', value: `${result.year}`},
              {name: 'Director', value: `${result.director}`},
              {name: 'Actors', value: `${result.actors}`},
              {name: 'Plot', value: `||${result.plot}||`},
              {name: 'Rating', value: `${result.rating} :star: `},

          );
      interaction.reply({embeds: [embed], ephemeral: false});
    }).catch((err) => {
      logger.debug(`[${PREFIX}] ${err}`);
    });


    logger.debug(`[${PREFIX}] finished!`);
  },
};

