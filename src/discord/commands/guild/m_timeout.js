'use strict';

const path = require('path');
const { MessageActionRow, Modal, TextInputComponent } = require('discord.js');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags/lib');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const mod = require('./mod');

const PREFIX = path.parse(__filename).name;

const embed = template.embedTemplate();

let actor = {};
let target = {};
let message = {};
let messageUrl = '';
const command = 'timeout';

let reason = 'Why are you timeouting this person?';
let duration = '4 days 3hrs 2 mins 30 seconds';

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Timeout')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    // https://discord.js.org/#/docs/discord.js/stable/class/ContextMenuInteraction
    actor = interaction.member;
    // logger.debug(`[${PREFIX}] actor.username: ${actor.user.username}`);
    logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);

    message = interaction.options.data[0].message.cleanContent;
    // logger.debug(`[${PREFIX}] message: ${message}`);

    messageUrl = interaction.options.data[0].message.url;

    const targetId = interaction.options.data[0].message.author.id;
    // logger.debug(`[${PREFIX}] targetId: ${targetId}`);

    target = await interaction.guild.members.fetch(targetId);
    logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);

    // Create the modal
    const modal = new Modal()
      .setCustomId('timeoutModal')
      .setTitle('Tripbot Timeout');
    const timeoutReason = new TextInputComponent()
      .setLabel('Why are you timouting this person?')
      .setStyle('PARAGRAPH')
      .setPlaceholder(reason)
      .setCustomId('timeoutReason')
      .setRequired(true);
    const timeoutDuration = new TextInputComponent()
      .setLabel('Timeout for how long? (Max/default 7 days)')
      .setStyle('SHORT')
      .setPlaceholder(duration)
      .setCustomId('timeoutDuration');
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new MessageActionRow().addComponents(timeoutReason);
    const secondActionRow = new MessageActionRow().addComponents(timeoutDuration);

    // Add inputs to the modal
    modal.addComponents(firstActionRow, secondActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
  },
  async submit(interaction) {
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);
    duration = interaction.fields.getTextInputValue('timeoutDuration');
    logger.debug(`[${PREFIX}] duration: ${duration}`);
    reason = interaction.fields.getTextInputValue('timeoutReason');
    reason = stripIndents`
    > ${reason}

    [The offending message:](${messageUrl})
    > ${message}`;
    logger.debug(`[${PREFIX}] reason: ${reason}`);
    embed.setTitle('Tripbot Timeout');
    embed.setDescription(`${actor.user.username} has timeout ${target.user.username}`);
    // embed.addField('Reason', reason);
    // embed.addField('Duration', duration);
    // embed.addField('Toggle', toggle);
    mod.execute(interaction, {
      actor, command, toggle: 'on', target, reason, duration,
    });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
