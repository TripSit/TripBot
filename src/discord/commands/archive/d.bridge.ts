/* eslint-disable*/
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  ModalSubmitInteraction,
  TextChannel,
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  InteractionEditReplyOptions,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { bridgeConfirm, bridgeCreate, bridgePause, bridgeRemove, bridgeResume } from '../../../global/commands/g.bridge';
import { startLog } from '../../utils/startLog';
import { getUser } from '../../../global/utils/knex';

export default dBridge;

const F = f(__filename);

export const dBridge: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('bridge')
    .setDescription('Manage the bridge between two discord channels')
    .addSubcommand(subcommand => subcommand
      .setName('create')
      .setDescription('Create a bridge between two discord channels')
      .addChannelOption(option => option.setName('internal_channel')
        .setDescription('Channel on your guild')
        .setRequired(true))
      .addStringOption(option => option.setName('external_channel')
        .setDescription('Channel ID on the other guild')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('confirm')
      .setDescription('Confirm a bridge creation between two discord channels')
      .addChannelOption(option => option.setName('internal_channel')
        .setDescription('Channel on your guild')
        .setRequired(true))
      .addStringOption(option => option.setName('external_channel')
        .setDescription('Channel ID on the other guild')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('pause')
      .setDescription('Pause a bridge between two discord channels')
      .addChannelOption(option => option.setName('internal_channel')
        .setDescription('Channel on your guild')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('resume')
      .setDescription('Resume a bridge between two discord channels')
      .addChannelOption(option => option.setName('internal_channel')
        .setDescription('Channel on your guild')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('remove')
      .setDescription('Remove a bridge between two discord channels')
      .addChannelOption(option => option.setName('internal_channel')
        .setDescription('Channel on your guild')
        .setRequired(true))),
  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: true });
    const command = interaction.options.getSubcommand();

    const embed = embedTemplate()
      .setTitle('Bridge')
      .setColor(Colors.DarkPurple);

    if (command === 'create') {
      // Create
      embed.setDescription(await bridgeCreate(interaction));
    } else if (command === 'confirm') {
      // Confirm
      embed.setDescription(await bridgeConfirm(interaction));
    } else if (command === 'pause') {
      // Pause
      embed.setDescription(await bridgePause(interaction));
    } else if (command === 'resume') {
      // Resume
      embed.setDescription(await bridgeResume(interaction));
    } else if (command === 'remove') {
      // Remove
      embed.setDescription(await bridgeRemove(interaction));
    }

    await interaction.editReply({
      embeds: [embed],
    });

    return true;
  },
};
