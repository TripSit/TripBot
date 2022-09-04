'use strict';

const { SlashCommandBuilder } = require('discord.js');
const yt = require('youtube-search-without-api-key');
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
      .setName('query')),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    logger.debug(`[${PREFIX}] starting /youtube with query: ${query}`);
    const res = await yt.search(query);
    const video = res[0];

    const embed = template.embedTemplate()
      .setTitle(video.title)
      .setURL(video.snippet.url)
      .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/YouTube_Logo_2017.svg/512px-YouTube_Logo_2017.svg.png')
      .setImage(video.snippet.thumbnails.url)
      .addFields(
        { name: 'Duration', value: video.snippet.duration, inline: true },
        { name: 'Published', value: video.snippet.publishedAt, inline: true },
      );

    if (video.description !== '') {
      embed.addField({ name: 'Description', value: video.description });
    }

    interaction.reply({ embeds: [embed] });
  },