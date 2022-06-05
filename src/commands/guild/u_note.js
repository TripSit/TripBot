'use strict';

const path = require('path');
const ms = require('ms');
const { MessageActionRow, Modal, TextInputComponent } = require('discord.js');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');
const mod = require('./mod');

const PREFIX = path.parse(__filename).name;

const embed = template.embedTemplate();

let actor = {};
let target = {};
const command = 'note';

let reason = 'I\'m lazy and did not provide a reason, I will be punished for this.';
let duration = 'Forever';

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
      .setCustomId('banModal')
      .setTitle('Tripbot Ban');
    const banReason = new TextInputComponent()
      .setLabel('Why are you banning this person?')
      .setStyle('PARAGRAPH')
      .setPlaceholder(reason)
      .setCustomId('banReason')
      .setRequired(true);
    const banDuration = new TextInputComponent()
      .setLabel('How long should this ban last?')
      .setStyle('SHORT')
      .setPlaceholder(duration)
      .setCustomId('banDuration');
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new MessageActionRow().addComponents(banReason);
    const secondActionRow = new MessageActionRow().addComponents(banDuration);

    // Add inputs to the modal
    modal.addComponents(firstActionRow, secondActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
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
    mod.execute(interaction, {
      actor, command, toggle: 'on', target, reason, duration,
    });
    // interaction.reply({ content: `I ${command}ed ${target.displayName} ${minutes ? ` for ${ms(minutes, { long: true })}` : ''}because '${reason}'`, ephemeral: true });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
