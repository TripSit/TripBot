'use strict';

const path = require('path');
const { ActionRowBuilder, ModalBuilder, TextInputBuilder } = require('discord.js');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { ContextMenuCommandBuilder } = require('discord.js');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const { moderate } = require('../../../global/utils/moderate');

const PREFIX = path.parse(__filename).name;

const embed = template.embedTemplate();

let actor = {};
let target = {};
const command = 'ban';

let reason = 'Why are you banning this person?';
let duration = '4 days 3hrs 2 mins 30 seconds';

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Ban')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    // https://discord.js.org/#/docs/discord.js/stable/class/ContextMenuInteraction
    actor = interaction.member;
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    target = interaction.options.data[0].member;
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    // Create the modal
    const modal = new ModalBuilder()
      .setCustomId('banModal')
      .setTitle('Tripbot Ban');
    const banReason = new TextInputBuilder()
      .setLabel('Why are you banning this person?')
      .setStyle('PARAGRAPH')
      .setPlaceholder(reason)
      .setCustomId('banReason')
      .setRequired(true);
    const banDuration = new TextInputBuilder()
      .setLabel('How long should this ban last?')
      .setStyle('SHORT')
      .setPlaceholder(duration)
      .setCustomId('banDuration');
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new ActionRowBuilder().addComponents(banReason);
    const secondActionRow = new ActionRowBuilder().addComponents(banDuration);

    // Add inputs to the modal
    modal.addComponents(firstActionRow, secondActionRow);
    // Show the modal to the user
    await interaction.showModalBuilder(modal);
  },
  async submit(interaction) {
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);
    duration = interaction.fields.getTextInputValue('banDuration');
    logger.debug(`[${PREFIX}] duration: ${duration}`);
    reason = interaction.fields.getTextInputValue('banReason');
    logger.debug(`[${PREFIX}] reason: ${reason}`);
    embed.setTitle('Tripbot Ban');
    embed.setDescription(`${actor.user.username} has banned ${target.user.username}`);
    // embed.addField('Reason', reason);
    // embed.addField('Duration', duration);
    // embed.addField('Toggle', toggle);
    await moderate(interaction, {
      actor, command, toggle: 'on', target, reason, duration,
    });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
