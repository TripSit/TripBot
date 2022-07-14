'use strict';

const path = require('path');
const { MessageActionRow, Modal, TextInputComponent } = require('discord.js');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags/lib');
const logger = require('../../../global/logger');
const template = require('../../../global/embed-template');
const mod = require('./mod');

const PREFIX = path.parse(__filename).name;

const embed = template.embedTemplate();

let actor = {};
let target = {};
let message = {};
let messageUrl = '';
const command = 'warn';

let reason = 'Why are you warning this person?';

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Warn')
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
      .setCustomId('warnModal')
      .setTitle('Tripbot Warn');
    const warnReason = new TextInputComponent()
      .setLabel('Why are you warning this person?')
      .setStyle('PARAGRAPH')
      .setPlaceholder(reason)
      .setCustomId('warnReason')
      .setRequired(true);
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new MessageActionRow().addComponents(warnReason);

    // Add inputs to the modal
    modal.addComponents(firstActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
  },
  async submit(interaction) {
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);
    // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);
    reason = interaction.fields.getTextInputValue('warnReason');
    reason = stripIndents`
    > ${reason}

    [The offending message:](${messageUrl})
    > ${message}

    `;
    logger.debug(`[${PREFIX}] reason: ${reason}`);
    embed.setTitle('Tripbot Warn');
    embed.setDescription(`${actor.user.username} has warned ${target.user.username}`);
    // embed.addField('Reason', reason);
    // embed.addField('Duration', duration);
    // embed.addField('Toggle', toggle);
    mod.execute(interaction, {
      actor, command, toggle: 'on', target, reason, duration: null,
    });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
