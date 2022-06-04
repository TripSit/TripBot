'use strict';

const path = require('path');
const { MessageActionRow, Modal, TextInputComponent } = require('discord.js');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Ban')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    // https://discord.js.org/#/docs/discord.js/stable/class/ContextMenuInteraction
    const embed = template.embedTemplate().setTitle('I would ban this user!');
    logger.debug(`[${PREFIX}] interaction: ${interaction}`);
    const actor = interaction.member;
    logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    const target = interaction.options.member;
    logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    const reason = 'message_content';
    const duration = null;
    const toggle = 'on';

    // Create the modal
    const modal = new Modal()
      .setCustomId('banModal')
      .setTitle('Tripbot Ban');
    const banReason = new TextInputComponent()
      .setCustomId('banReason')
      .setLabel('Why are you banning this person?')
      .setStyle('PARAGRAPH');
    const banDuration = new TextInputComponent()
      .setCustomId('banDuration')
      .setLabel('How long should this ban last?')
      .setStyle('SHORT');
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new MessageActionRow().addComponents(banReason);
    const secondActionRow = new MessageActionRow().addComponents(banDuration);

    // Add inputs to the modal
    modal.addComponents(firstActionRow, secondActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
    logger.debug(`[${PREFIX}] finished!`);

    // interaction.reply({ embeds: [embed], ephemeral: false });
    // logger.debug(`[${PREFIX}] finished!`);
  },
};
