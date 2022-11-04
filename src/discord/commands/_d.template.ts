/* eslint-disable no-unused-vars */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ModalSubmitInteraction,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../@types/commandDef';
import {embedTemplate} from '../utils/embedTemplate';
import env from '../../global/utils/env.config';
import log from '../../global/utils/log';
import {startLog} from '../utils/startLog';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const bug: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('template')
    .setDescription('Example!'),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    // Create the modal
    const modal = new ModalBuilder()
      .setCustomId(`modal~${interaction.id}`)
      .setTitle('Modal');
    const modalInput = new TextInputBuilder()
      .setCustomId('modalInput')
      .setLabel('Input')
      .setStyle(TextInputStyle.Paragraph);
    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(modalInput);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
    log.debug(`[${PREFIX}] displayed modal!`);
    const filter = (interaction:ModalSubmitInteraction) => interaction.customId.includes(`feedbackReportModal`);
    const submitted = await interaction.awaitModalSubmit({filter, time: 0});
    if (submitted) {
      if (submitted.customId.split('~')[1] !== interaction.id) return true;
      const input = submitted.fields.getTextInputValue('modalInput');
      log.debug(`[${PREFIX}] input: ${input}`);
    }
    return true;
  },
};
