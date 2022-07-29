'use strict';

const { SlashCommandBuilder } = require('discord.js');
const youtube = require('../../../global/utils/youtube');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');

// eslint-disable-next-line import/order
const PREFIX = require('path').parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('youtube')
    .setDescription('Search YouTube')
    .addStringOption(option => option
      .setDescription('What video do you want?')
      .setRequired(true)
      .setName('search')),

  async execute(interaction) {
    const query = interaction.options.getString('query');

    youtube
      .search(query)
      // eslint-disable-next-line no-shadow
      .then(result => {
        // eslint-disable-next-line prefer-template
        const embed = template.embedTemplate()
          .setTitle(`YouTube: ${result[0].title}`)
          .setURL(result[0].link)
          .setThumbnail(result[0].thumbnails.high.url)
          .setDescription(result[0].description)
          .addField('Channel', result[0].channelTitle)
          .setColor(0xFF0000);
        interaction.reply({ embeds: [embed], ephemeral: false });
      })

      .catch(err => {
        interaction.reply(
          `Sorry, there was an ${err}`,
        );
        logger.debug(`[${PREFIX} failed! ${err} `);
      });
  },
};
