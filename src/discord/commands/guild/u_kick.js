'use strict';

const path = require('path');
const { MessageActionRow, Modal, TextInputComponent } = require('discord.js');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { ContextMenuCommandBuilder } = require('discord.js');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const { moderate } = require('../../../global/utils/moderate');

const PREFIX = path.parse(__filename).name;

const embed = template.embedTemplate();

let actor = {};
let target = {};
const command = 'kick';

let reason = 'Why are you kicking this person?';

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Kick')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    actor = interaction.member;
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);

    if (interaction.options.data[0].message.author.discriminator === '0000') {
      logger.debug(`[${PREFIX}] message: ${JSON.stringify(interaction.options.data[0].message, null, 2)}`);
      // This is a bot, so we need to get the username of the user
      target = interaction.options.data[0].message.author.username;
      logger.debug(`[${PREFIX}] target: ${target}`);
    } else {
      target = interaction.options.data[0].member;
    }
    logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    // Create the modal
    const modal = new Modal()
      .setCustomId('kickModal')
      .setTitle('Tripbot Kick');
    const banReason = new TextInputComponent()
      .setLabel('Why are you kicking this person?')
      .setStyle('PARAGRAPH')
      .setPlaceholder(reason)
      .setRequired(true)
      .setCustomId('kickReason');

    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new MessageActionRow().addComponents(banReason);

    // Add inputs to the modal
    modal.addComponents(firstActionRow);

    // Show the modal to the user
    await interaction.showModal(modal);
  },
  async submit(interaction) {
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);
    reason = interaction.fields.getTextInputValue('kickReason');
    logger.debug(`[${PREFIX}] reason: ${reason}`);
    embed.setTitle('Tripbot Kick');
    embed.setDescription(`${actor.user.username} has kicked ${target.user.username}`);
    // embed.addField('Reason', reason);
    // embed.addField('Duration', duration);
    // embed.addField('Toggle', toggle);
    await moderate(interaction, {
      actor, command, toggle: 'on', target, reason, duration: null,
    });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
