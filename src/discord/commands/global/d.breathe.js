'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../../global/utils/logger');
const { breathe } = require('../../../global/utils/breathe');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('breathe')
    .setDescription('Remember to breathe')
    .addStringOption(option => option.setName('exercise')
      .setDescription('Which exercise?')
      .addChoices(
        { name: '1', value: '1' },
        { name: '2', value: '2' },
        { name: '3', value: '3' },
        { name: '4', value: '4' },
      )),
  async execute(interaction, parameters) {
    const choice = interaction.options.getString('exercise') || parameters;
    logger.debug(`[${PREFIX}] choice: ${choice}`);

    const data = await breathe(choice);

    logger.debug(`[${PREFIX}] data: ${data}`);

    if (interaction.replied) interaction.followUp(data);
    else interaction.reply(data);
  },
};
