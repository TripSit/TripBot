'use strict';

const { SlashCommandBuilder } = require('discord.js');
const PREFIX = require('path').parse(__filename).name;
const imgur = require('../../../global/utils/imgur');
const logger = require('../../../global/utils/logger');
// const template = require('../../utils/embed-template');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('imgur')
    .setDescription('Search Imgur')
    .addStringOption(option => option
      .setName('search')
      .setDescription('What are you looking for?')
      .setRequired(true))
    .addStringOption(option => option
      .setName('sort')
      .setDescription('How should the results be sorted?')
      .addChoices(
        { name: 'Default: Top', value: 'top' },
        { name: 'Viral', value: 'viral' },
        { name: 'Time', value: 'time' },
      ))
    .addStringOption(option => option
      .setName('window')
      .setDescription('How far back should we look?')
      .addChoices(
        { name: 'Default: All', value: 'all' },
        { name: 'Day', value: 'day' },
        { name: 'Week', value: 'week' },
        { name: 'Month', value: 'month' },
        { name: 'Year', value: 'year' },
      )),
  async execute(interaction) {
    // Sometimes the API takes a few seconds to respond.
    await interaction.reply('Searching Imgur...');
    const search = interaction.options.getString('search');
    const sort = interaction.options.getString('sort') || 'top';
    const window = interaction.options.getString('window') || 'all';
    logger.debug(`[${PREFIX}] query: ${search}`);
    logger.debug(`[${PREFIX}] sort: ${sort}`);
    logger.debug(`[${PREFIX}] window: ${window}`);

    const query = `https://api.imgur.com/3/gallery/search/${sort !== null ? `${sort}/` : ''}${window !== null ? `${window}/` : ''}?q=${search}`;
    logger.debug(`[${PREFIX}] query: ${query}`);

    const url = await imgur.search(query);

    logger.debug(`[${PREFIX}] url: ${url}`);

    if (!interaction.replied) interaction.reply(url);
    else interaction.editReply(url);
  },
};
