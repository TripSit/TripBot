'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const youtube = require('../../../global/utils/youtube-search');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');

// eslint-disable-next-line import/order
const PREFIX = require('path').parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yt-search')
    .setDescription('Search YouTube')
    .addStringOption(option => option
      .setDescription('Your search query')
      .setRequired(true)
      .setName('query')),

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
          'Sorry, an error occured while trying to execute this command',
        );
        logger.debug(`[${PREFIX} failed! ${err} `);
      });
  },
};
