'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const logger = require('../../../global/logger');
const template = require('../../../global/embed-template');

const PREFIX = path.parse(__filename).name;

const {
  rapidApiKey,
} = require('../../../../env');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('motivate')
    .setDescription('Random motivational quotes'),

  async execute(interaction) {
    const embed = template.embedTemplate();
    try {
      const { data } = await axios.post('https://motivational-quotes1.p.rapidapi.com/motivation', {
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Host': 'motivational-quotes1.p.rapidapi.com',
          'X-RapidAPI-Key': rapidApiKey,
        },
        data: JSON.stringify({
          key1: 'value',
          key2: 'value',
        }),
      });
      logger.debug(`[${PREFIX}] data:`, data);
      embed.setDescription(data);
    } catch (error) {
      logger.error(`[${PREFIX}] ${error}`);
      embed.setDescription(`Error with this API! This is not an error with the bot!\n\n${error}`);
    }

    if (!interaction.replied) {
      interaction.reply({
        embeds: [embed],
        ephemeral: false,
      });
    } else {
      interaction.followUp({
        embeds: [embed],
        ephemeral: false,
      });
    }
  },
};
