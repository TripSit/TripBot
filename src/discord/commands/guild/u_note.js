'use strict';

const path = require('path');
const { MessageActionRow, Modal, TextInputComponent } = require('discord.js');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const mod = require('./mod');

const PREFIX = path.parse(__filename).name;

const embed = template.embedTemplate();

let actor = {};
let target = {};
const command = 'note';

let reason = 'What are you noting about this person?';

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Note')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    // https://discord.js.org/#/docs/discord.js/stable/class/ContextMenuInteraction
    actor = interaction.member;
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    target = interaction.options.data[0].member;
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    // Create the modal
    const modal = new Modal()
      .setCustomId('noteModal')
      .setTitle('Tripbot Note');
    const noteReason = new TextInputComponent()
      .setLabel('What are you noting about this person?')
      .setStyle('PARAGRAPH')
      .setPlaceholder(reason)
      .setCustomId('noteReason')
      .setRequired(true);
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new MessageActionRow().addComponents(noteReason);

    // Add inputs to the modal
    modal.addComponents(firstActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
  },
  async submit(interaction) {
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);
    reason = interaction.fields.getTextInputValue('noteReason');
    logger.debug(`[${PREFIX}] reason: ${reason}`);
    embed.setTitle('Tripbot Note');
    embed.setDescription(`${actor.user.username} has noted ${target.user.username}`);
    // embed.addField('Reason', reason);
    // embed.addField('Duration', duration);
    // embed.addField('Toggle', toggle);
    mod.execute(interaction, {
      actor, command, toggle: 'on', target, reason, duration: null,
    });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
