'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const logger = require('../../utils/logger');

const PREFIX = path.parse(__filename).name;

const {
  rapidApiKey,
  wolframApiKey,
} = require('../../../env');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wolfram')
    .setDescription('Ask a question on Wolfram Alpha')
    .addStringOption(option => option
      .setName('question')
      .setDescription('What do you want to know?')
      .setRequired(true)),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    logger.debug(`[${PREFIX}] question: ${question}`);

    const requestPayload = new URLSearchParams();
    requestPayload.append('input', question);
    requestPayload.append('apiKey', wolframApiKey);

    const { data } = await axios.post(
      'https://wolframalphavolodimir-kudriachenkov1.p.rapidapi.com/createQuery',
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'X-RapidAPI-Host': 'WolframAlphavolodimir-kudriachenkoV1.p.rapidapi.com',
          'X-RapidAPI-Key': rapidApiKey,
        },
        data: requestPayload,
      },
    );

    logger.debug(`[${PREFIX}] data:`, data);
    // const embed = template.embedTemplate()
    //     .setTitle(`Definition for: ${word}`)
    //     .addFields(
    // eslint-disable-next-line
    //         { name: `Definition A (+${data.list[0].thumbs_up}/-${data.list[0].thumbs_down})`, value: `${data.list[0].definition.length > 1024 ? `${data.list[0].definition.slice(0, 1020)}...` : data.list[0].definition}`, inline: false },
    //         { name: 'Example A', value: data.list[0].example, inline: false },
    // eslint-disable-next-line
    //         { name: `Definition B (+${data.list[1].thumbs_up}/-${data.list[1].thumbs_down})`, value: `${data.list[1].definition.length > 1024 ? `${data.list[1].definition.slice(0, 1020)}...` : data.list[1].definition}`, inline: false },
    //         { name: 'Example B', value: data.list[1].example, inline: false },
    // eslint-disable-next-line
    //         { name: `Definition C (+${data.list[2].thumbs_up}/-${data.list[2].thumbs_down})`, value: `${data.list[2].definition.length > 1024 ? `${data.list[2].definition.slice(0, 1020)}...` : data.list[2].definition}`, inline: false },
    //         { name: 'Example C', value: data.list[2].example, inline: false },
    //     );
    // if (!interaction.replied) {
    //     interaction.reply({ embeds: [embed], ephemeral: false });
    // }
    // else {
    //     interaction.followUp({ embeds: [embed], ephemeral: false });
    // }
    // logger.debug(`[${PREFIX}] finished!`);
    // return;
  },
};
