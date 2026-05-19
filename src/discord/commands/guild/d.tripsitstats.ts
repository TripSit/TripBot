/* eslint-disable sonarjs/no-duplicate-string */
import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import getTripSitStatistics from '../../../global/commands/g.tripsitstats';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dTripsitStats: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tripsit_stats')
    .setNameLocalizations(getCommandLocalizations('tripsitstats', 'commandName'))
    .setDescription(t('en-US', 'tripsitstats', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('session')
      .setDescription(t('en-US', 'tripsitstats', 'sessionSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'sessionSubcommand'))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription(t('en-US', 'tripsitstats', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'ephemeralOption'))))
    .addSubcommand(subcommand => subcommand
      .setName('command')
      .setDescription(t('en-US', 'tripsitstats', 'commandSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'commandSubcommand'))
      .addStringOption(option => option
        .setName('target_command')
        .setDescription(t('en-US', 'tripsitstats', 'targetCommandOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'targetCommandOption')))
      .addIntegerOption(option => option
        .setName('days')
        .setDescription(t('en-US', 'tripsitstats', 'daysOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'daysOption')))
      .addBooleanOption(option => option
        .setName('ephemeral')
        .setDescription(t('en-US', 'tripsitstats', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tripsitstats', 'ephemeralOption')))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'tripsitstats');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });

    const subcommand = interaction.options.getSubcommand();
    let stats = null;
    if (subcommand === 'command') {
      const command = interaction.options.getString('target_command');
      const days = interaction.options.getInteger('days') || 0;
      stats = await getTripSitStatistics(subcommand, command, days);
    } else if (subcommand === 'session') {
      stats = await getTripSitStatistics(subcommand);
    }

    const titleKey = subcommand === 'session' ? 'embedTitleSession' : 'embedTitleCommand';
    const embed = embedTemplate()
      .setTitle(t(locale, 'tripsitstats', titleKey))
      .setDescription(stats);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dTripsitStats;
