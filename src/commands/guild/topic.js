'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const topics = require('../../assets/topics.json');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topic')
    .setDescription('Sends a random topic!'),

  async execute(interaction) {
    const randomTopic = topics[Math.floor(Math.random() * Object.keys(topics).length).toString()];
    const embed = template.embedTemplate().setDescription(randomTopic);
    if (interaction.replied) interaction.followUp({ embeds: [embed] });
    else interaction.reply({ embeds: [embed] });
  },
};
