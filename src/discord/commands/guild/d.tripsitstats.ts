/* eslint-disable sonarjs/no-duplicate-string */
import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import getTripSitStatistics from '../../../global/commands/g.tripsitstats';

const F = f(__filename);

export const dTripsitStats: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tripsit_stats')
    .setDescription('Get stats on a feature of TripSit')
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('session')
      .setDescription('Get stats for TripSit sessions')
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(subcommand => subcommand
      .setName('command')
      .setDescription('Get stats for commands')
      .addStringOption(option => option
        .setName('target_command')
        .setDescription('The command to get stats for'))
      .addIntegerOption(option => option
        .setName('days')
        .setDescription('Number of days to look back'))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you'))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });

    let stats = null;
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'command') {
      const command = interaction.options.getString('target_command');
      const days = interaction.options.getInteger('days') || 0;
      stats = await getTripSitStatistics(subcommand, command, days);
    } else if (subcommand === 'session') {
      stats = await getTripSitStatistics(subcommand);
    }

    // Record this command usage

    const embed = embedTemplate()
      .setTitle(`TripSit ${subcommand.charAt(0).toUpperCase() + subcommand.slice(1)} Stats`)
      .setDescription(stats);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dTripsitStats;
