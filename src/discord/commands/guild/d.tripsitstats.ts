/* eslint-disable sonarjs/no-duplicate-string */
import {
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
    .addSubcommand(subcommand => subcommand
      .setName('session')
      .setDescription('Get stats for TripSit sessions')
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you'))),
  // .addSubcommand(subcommand => subcommand
  //   .setName('command')
  //   .setDescription('Get stats for a command (Not Implemented)')
  //   .addBooleanOption(option => option
  //     .setName('ephemeral')
  //     .setDescription('Set to "True" to show the response only to you')))
  // .addSubcommand(subcommand => subcommand
  //   .setName('helpers')
  //   .setDescription('Get stats for Helpers (Not Implemented)')
  //   .addBooleanOption(option => option
  //     .setName('ephemeral')
  //     .setDescription('Set to "True" to show the response only to you'))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });

    const subcommand = interaction.options.getSubcommand();

    const stats = await getTripSitStatistics(subcommand);
    const embed = embedTemplate()
      .setTitle(`TripSit ${subcommand.charAt(0).toUpperCase() + subcommand.slice(1)} Stats`)
      .setDescription(stats);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dTripsitStats;
