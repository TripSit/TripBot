const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const PREFIX = require('path').parse(__filename).name;
const template = require('../../utils/embed-template');
const axios = require('axios');

if (process.env.NODE_ENV !== 'production') { require('dotenv').config(); }
const API_KEY = process.env.rapid_api_key;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('motivate')
    .setDescription('Random motivational quotes'),
  async execute(interaction) {
    const options = {
      method: 'POST',
      url: 'https://motivational-quotes1.p.rapidapi.com/motivation',
      headers: {
        'content-type': 'application/json',
        'X-RapidAPI-Host': 'motivational-quotes1.p.rapidapi.com',
        'X-RapidAPI-Key': API_KEY,
      },
      data: '{"key1":"value","key2":"value"}',
    };

    let data = {};
    axios.request(options).then(response => {
      data = response.data;
      console.log(response.data);
      logger.debug(`[${PREFIX}] data: ${JSON.stringify(data, null, 2)}`);
      const embed = template.embedTemplate()
        .setDescription(`${data}`);
      if (!interaction.replied) { interaction.reply({ embeds: [embed], ephemeral: false }); } else { interaction.followUp({ embeds: [embed], ephemeral: false }); }
      logger.debug(`[${PREFIX}] finished!`);
    }).catch(error => {
      console.error(error);
    });
  },
};
