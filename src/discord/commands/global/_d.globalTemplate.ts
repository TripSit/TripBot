/* eslint-disable */
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
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { globalTemplate } from '../../../global/commands/_g.template';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dTemplate;

export const dTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('template')
    .setDescription('Example!')
    .addSubcommand(subcommand => subcommand
      .setName('subcommand')
      .setDescription('subcommand')
      .addStringOption(option => option.setName('string')
        .setDescription('string')
        .setRequired(true))
      .addNumberOption(option => option.setName('number')
        .setDescription('number')
        .setRequired(true))
      .addIntegerOption(option => option.setName('integer')
        .setDescription('integer')
        .setRequired(true))
      .addBooleanOption(option => option.setName('boolean')
        .setDescription('boolean')
        .setRequired(true))
      .addUserOption(option => option.setName('user')
        .setDescription('user')
        .setRequired(true))
      .addChannelOption(option => option.setName('channel')
        .setDescription('channel')
        .setRequired(true))
      .addRoleOption(option => option.setName('role')
        .setDescription('role')
        .setRequired(true))
      .addMentionableOption(option => option.setName('mentionable')
        .setDescription('mentionable')
        .setRequired(true))),
  async execute(interaction) {
    startLog(F, interaction);

    const string = interaction.options.getString('string');
    const number = interaction.options.getNumber('number');
    const integer = interaction.options.getInteger('integer');
    const boolean = interaction.options.getBoolean('boolean');
    const user = interaction.options.getUser('user');
    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');
    const mentionable = interaction.options.getMentionable('mentionable');

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
    // log.debug(F, `displayed modal!`);
    const filter = (i:ModalSubmitInteraction) => i.customId.includes('feedbackReportModal');
    interaction.awaitModalSubmit({ filter, time: 0 })
      .then(async i => {
        // Collect the modal
        if (i.customId.split('~')[2] !== interaction.id) return;
        i.deferReply({ ephemeral: true });
        const input = i.fields.getTextInputValue('modalInput');
      });
    return true;
  },
};
