/* eslint-disable no-unused-vars */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../utils/commandDef';
import {embedTemplate} from '../utils/embedTemplate';
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const bug: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('template')
      .setDescription('Example!'),
  async execute(interaction) {
    logger.debug(`[${PREFIX}] starting!`);

    // Create the modal
    const modal = new ModalBuilder()
        .setCustomId('modal')
        .setTitle('Modal');
    const modalInput = new TextInputBuilder()
        .setCustomId('modalInput')
        .setLabel('Input')
        .setStyle(TextInputStyle.Paragraph);
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(modalInput);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
    logger.debug(`[${PREFIX}] displayed modal!`);
  },
  async submit(interaction) {
    const modalOutput = interaction.fields.getTextInputValue('modalInput');

    const embed = embedTemplate()
        .setColor(Colors.Purple)
        .setTitle('Title')
        .setDescription(modalOutput);
    interaction.reply({embeds: [embed], ephemeral: true});
  },
};
