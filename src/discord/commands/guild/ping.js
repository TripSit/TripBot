'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
} = require('discord.js');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../../global/utils/logger');
// const paginationEmbed = require('discordjs-button-pagination'); // eslint-disable-line
const paginationEmbed = require('../../utils/pagination');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Health check'),

  async execute(interaction) {
    const embed1 = new EmbedBuilder()
      .setTitle('First Page')
      .setDescription('This is the first page');

    const embed2 = new EmbedBuilder()
      .setTitle('Second Page')
      .setDescription('This is the second page');

    const button1 = new ButtonBuilder()
      .setCustomId('previousbtn')
      .setLabel('Previous')
      .setStyle('Danger');

    const button2 = new ButtonBuilder()
      .setCustomId('nextbtn')
      .setLabel('Next')
      .setStyle('Success');

    // Create an array of embeds
    const pages = [
      embed1,
      embed2,
      // ....
      // embedN
    ];

    // create an array of buttons

    const buttonList = [
      button1,
      button2,
    ];
    // Call the paginationEmbed method, first three arguments are required
    // timeout is the time till the reaction collectors are active,
    // after this you can't change pages (in ms), defaults to 120000
    paginationEmbed(interaction, pages, buttonList, 120000);
    // There you go, now you have paged embeds
    logger.debug(`[${PREFIX}] finished!`);
  },
};
