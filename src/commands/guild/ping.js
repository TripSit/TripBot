'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Health check'),

  async execute(interaction) {
    const embed = template.embedTemplate().setTitle('PONG');
    logger.debug(`[${PREFIX}] finished!`);
    interaction.followup({
      embeds: [embed],
      ephemeral: false,
    });
  },
};
