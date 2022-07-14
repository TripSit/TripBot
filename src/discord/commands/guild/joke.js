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
    .setName('joke')
    .setDescription('Random jokes'),

  async execute(interaction) {
    const { data } = await axios.get('https://jokeapi-v2.p.rapidapi.com/joke/Misc,Pun', {
      params: {
        format: 'json',
        blacklistFlags: 'nsfw,religious,political,racist,sexist,explicit',
        'safe-mode': 'true',
      },
      headers: {
        'X-RapidAPI-Host': 'jokeapi-v2.p.rapidapi.com',
        'X-RapidAPI-Key': rapidApiKey,
      },
    });

    const embed = template.embedTemplate();
    if (data.type === 'twopart') embed.setTitle(data.setup).setDescription(data.delivery);
    else embed.setTitle(data.joke);

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

    logger.debug(`[${PREFIX}] finished!`);
  },
};
