'use strict';

const { SlashCommandBuilder } = require('discord.js');
const template = require('../../utils/embed-template');
const { topic } = require('../../../global/utils/topic');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topic')
    .setDescription('Sends a random topic!'),

  async execute(interaction) {
    const data = await topic();
    const embed = template.embedTemplate().setDescription(data);

    if (interaction.replied) interaction.followUp({ embeds: [embed] });
    else interaction.reply({ embeds: [embed] });
  },
};
