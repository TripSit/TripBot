'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { combochart } = require('../../../global/utils/combochart');

module.exports = {
  data: new SlashCommandBuilder().setName('combochart').setDescription('Display TripSit\'s Combo Chart'),
  async execute(interaction) {
    const url = await combochart();
    if (!interaction.replied) interaction.reply(url);
    else interaction.followUp(url);
  },
};
