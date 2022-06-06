'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const mod = require('./mod');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user')
    .addStringOption(option => option
      .setDescription('User to report!')
      .setRequired(true)
      .setName('target'))
    .addStringOption(option => option
      .setDescription('Where are they?')
      .setRequired(true)
      .setName('channel'))
    .addStringOption(option => option
      .setDescription('What are they doing?')
      .setRequired(true)
      .setName('reason')),

  async execute(interaction) {
    const actor = interaction.member;
    const target = interaction.options.getString('target');
    const channel = interaction.options.getString('channel');
    const reason = `${interaction.options.getString('reason')}`;
    const command = 'report';

    await mod.execute(interaction, {
      actor,
      command,
      toggle: null,
      target,
      reason,
      duration: null,
      channel,
    });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
