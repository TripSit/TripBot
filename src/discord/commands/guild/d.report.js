'use strict';

const PREFIX = require('path').parse(__filename).name;
const { SlashCommandBuilder } = require('discord.js');
const template = require('../../utils/embed-template');
const logger = require('../../../global/utils/logger');
const { moderate } = require('../../../global/utils/moderate');

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
    logger.debug(`[${PREFIX}] started!`);
    await interaction.deferReply({ ephemeral: true });
    const embed = template.embedTemplate()
      .setColor('DARK_BLUE')
      .setDescription('Reporting...');
    await interaction.editReply({ embeds: [embed], ephemeral: true });

    const actor = interaction.member;
    const command = 'report';
    const target = interaction.options.getString('target');
    const channel = interaction.options.getString('channel');
    const toggle = null;
    const reason = `${interaction.options.getString('reason')}`;
    const duration = null;

    const result = await moderate(actor, command, target, channel, toggle, reason, duration);
    logger.debug(`[${PREFIX}] Result: ${result}`);

    embed.setDescription(result);

    interaction.editReply({ embeds: [embed], ephemeral: true });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
