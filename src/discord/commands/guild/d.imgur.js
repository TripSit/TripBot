'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const imgur = require('../../../global/utils/imgur');
const template = require('../../utils/embed-template');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('imgur')
    .setDescription('Search Imgur')
    .addStringOption(option => option
      .setName('query')
      .setDescription('What are you looking for?')
      .setRequired(true)),

  async execute(interaction) {
    const query = interaction.options.getString('query');

    const url = await imgur.search(query);

    const embed = template.embedTemplate()
      .setTitle(`Imgur search: ${query}`)
      .setImage(await url)
      .setURL(await url)
      .setColor(0x89c623);

    interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
