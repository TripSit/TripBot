'use strict';

const path = require('path');
const { MessageActionRow, Modal, TextInputComponent } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bug')
    .setDescription('Report a bug or other feedback to the bot dev team!'),
  async execute(interaction) {
    // Create the modal
    const modal = new Modal()
      .setCustomId('bugReportModal')
      .setTitle('Tripbot Bug Report');
    const bugReport = new TextInputComponent()
      .setCustomId('bugReport')
      .setLabel('What would you like to tell the bot dev team?')
      .setStyle('PARAGRAPH');
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new MessageActionRow().addComponents(bugReport);
    // Add inputs to the modal
    modal.addComponents(firstActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
