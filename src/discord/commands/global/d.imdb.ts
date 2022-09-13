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
      console.log(result);
    });


    logger.debug(`[${PREFIX}] finished!`);
  },
};

