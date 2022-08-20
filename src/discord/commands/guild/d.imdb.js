'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PREFIX = require('path').parse(__filename).name;
const Imdb = require('imdb-api');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');

const imdbClient = new Imdb.Client({ apiKey: process.env.ImdbToken });
module.exports = {
  data: new SlashCommandBuilder()
    .setName('imdb')
    .setDescription('Search for a movie or series on IMDb')
    .addStringOption(option => option
      .setDescription('Movie / Series title')
      .setRequired(true)
      .setName('name')),

  async execute(interaction) {
    const name = interaction.options.getString('name');

    logger.debug(`[${PREFIX}] starting /imdb with 'name' ${name}`);

    imdbClient.get({ name }).then(async result => {
      const embed = template.embedTemplate()
        .setTitle(`${result.title} (${result.year})`)
        .setImage(result.poster)
        .setURL(result.imdburl)
        .addFields(
          { name: 'Title', value: `${result.title}` },
          { name: 'Year', value: `${result.year}` },
          { name: 'Director', value: `${result.director}` },
          { name: 'Actors', value: `${result.actors}` },
          { name: 'Plot', value: `||${result.plot}||` },
          { name: 'Rating', value: `${result.rating} :star: ` },

        );

      interaction.reply({ embeds: [embed], ephemeral: false });
    }).catch(err => {
      interaction.reply('Sorry, i could not find that movie', { ephemeral: true });
      logger.debug(`[${PREFIX}] ${err}`);
      console.log(err);
      console.log(`\n\n name: ${name}`);
    });
  },
};
