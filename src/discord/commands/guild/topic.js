'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/logger');
const template = require('../../../global/embed-template');
const topics = require('../../../assets/data/topics.json');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('topic')
    .setDescription('Sends a random topic!'),

  async execute(interaction) {
    // Pick a random topic from topics.json
    const randomTopic = topics[Math.floor(Math.random() * Object.keys(topics).length).toString()];
    logger.debug(`[${PREFIX}] random_topic: ${randomTopic}`);
    const embed = template.embedTemplate().setDescription(randomTopic);
    if (!interaction.replied) {
      interaction.reply({
        embeds: [embed],
        ephemeral: false,
      });
    } else {
      interaction.followUp({
        embeds: [embed],
        ephemeral: false,
      });
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
