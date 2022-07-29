'use strict';

const PREFIX = require('path').parse(__filename).name;
const { ActionRowBuilder, Modal, TextInputBuilder } = require('discord.js');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { ContextMenuCommandBuilder } = require('discord.js');
const { stripIndents } = require('common-tags/lib');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const { moderate } = require('../../../global/utils/moderate');

let actor = {};
let target = {};
let message = {};
let channel = '';
let messageUrl = '';
const command = 'timeout';

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Timeout')
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    // https://discord.js.org/#/docs/discord.js/stable/class/ContextMenuInteraction
    actor = interaction.member;
    // logger.debug(`[${PREFIX}] actor.username: ${actor.user.username}`);
    // logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor, null, 2)}`);

    message = interaction.options.data[0].message.cleanContent;
    // logger.debug(`[${PREFIX}] message: ${message}`);

    messageUrl = interaction.options.data[0].message.url;

    if (interaction.options.data[0].message.author.discriminator === '0000') {
      // This is a bot, so we need to get the username of the user
      target = interaction.options.data[0].message.author.username;
      logger.debug(`[${PREFIX}] target: ${target}`);
    } else {
      const targetId = interaction.options.data[0].message.author.id;
      logger.debug(`[${PREFIX}] targetId: ${targetId}`);

      target = await interaction.guild.members.fetch(targetId);
      // logger.debug(`[${PREFIX}] target: ${JSON.stringify(target, null, 2)}`);
      logger.debug(`[${PREFIX}] target.user.username: ${target.user.username}`);
    }

    // Create the modal
    const modal = new Modal()
      .setCustomId('timeoutModal')
      .setTitle('Tripbot Timeout');
    const timeoutReason = new TextInputBuilder()
      .setLabel('Why are you timouting this person?')
      .setStyle('PARAGRAPH')
      .setPlaceholder('Why are you timeouting this person?')
      .setCustomId('timeoutReason')
      .setRequired(true);
    const timeoutDuration = new TextInputBuilder()
      .setLabel('Timeout for how long? (Max/default 7 days)')
      .setStyle('SHORT')
      .setPlaceholder('4 days 3hrs 2 mins 30 seconds')
      .setCustomId('timeoutDuration');
    // An action row only holds one text input, so you need one action row per text input.
    const firstActionRow = new ActionRowBuilder().addComponents(timeoutReason);
    const secondActionRow = new ActionRowBuilder().addComponents(timeoutDuration);

    // Add inputs to the modal
    modal.addComponents(firstActionRow, secondActionRow);
    // Show the modal to the user
    await interaction.showModal(modal);
  },
  async submit(interaction) {
    logger.debug(`[${PREFIX}] started!`);
    // await interaction.deferReply({ ephemeral: true });
    const embed = template.embedTemplate()
      .setColor('DARK_BLUE')
      .setDescription('Reporting...');
    // await interaction.editReply({ embeds: [embed], ephemeral: true });
    logger.debug(`[${PREFIX}] options: ${JSON.stringify(interaction.options, null, 2)}`);

    channel = interaction.channel;
    actor = interaction.member;
    logger.debug(`[${PREFIX}] actor: ${JSON.stringify(actor.displayName, null, 2)}`);
    logger.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    logger.debug(`[${PREFIX}] target: ${JSON.stringify(target.displayName, null, 2)}`);
    logger.debug(`[${PREFIX}] channel: ${JSON.stringify(channel.name, null, 2)}`);
    const reason = stripIndents`
    > ${interaction.fields.getTextInputValue('timeoutReason') ? interaction.fields.getTextInputValue('timeoutReason') : 'No reason given'}

    [The offending message:](${messageUrl})
    > ${message}

    `;

    const toggle = null;
    const duration = interaction.fields.getTextInputValue('timeoutDuration');
    const result = await moderate(actor, command, target, channel, toggle, reason, duration);
    logger.debug(`[${PREFIX}] Result: ${result}`);

    embed.setDescription(result);

    interaction.reply({ embeds: [embed], ephemeral: true });

    logger.debug(`[${PREFIX}] finished!`);
  },
};
