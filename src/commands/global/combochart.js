'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder().setName('combochart').setDescription('Display TripSit\'s Combo Chart'),
  async execute(interaction) {
    const url = 'https://i.imgur.com/juzYjDl.png';
    if (!interaction.replied) interaction.reply(url);
    else interaction.followUp(url);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
