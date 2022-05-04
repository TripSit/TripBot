'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');

const PREFIX = path.parse(__filename).name;
const URL = 'https://i.imgur.com/wETJsZr.png';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reagents')
    .setDescription('Display reagent color chart!'),

  async execute(interaction) {
    if (!interaction.replied) interaction.reply(URL);
    else interaction.followUp(URL);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
