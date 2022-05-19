'use strict';

const path = require('path');
const {
  MessageActionRow, Modal, TextInputComponent,
} = require('discord.js');
const logger = require('./logger');

const PREFIX = path.parse(__filename).name;

module.exports = {
  async execute(interaction) {
    // Create the modal
    const modal = new Modal()
      .setCustomId('tripsitModal')
      .setTitle('TripSit Help Request');
    modal.addComponents(new MessageActionRow().addComponents(new TextInputComponent()
      .setCustomId('triageInput')
      .setLabel('What substance? How much taken? What time?')
      .setStyle('SHORT')));
    modal.addComponents(new MessageActionRow().addComponents(new TextInputComponent()
      .setCustomId('introInput')
      .setLabel('What\'s going on? Give us the details!')
      .setStyle('PARAGRAPH')));
    await interaction.showModal(modal);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
