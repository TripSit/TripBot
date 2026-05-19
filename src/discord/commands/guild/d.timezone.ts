/* eslint-disable max-len */
import {
  SlashCommandBuilder,
  GuildMember,
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { timezone } from '../../../global/commands/g.timezone';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dTimezone: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('timezone')
    .setNameLocalizations(getCommandLocalizations('timezone', 'commandName'))
    .setDescription(t('en-US', 'timezone', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('timezone', 'commandDescription'))
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('get')
      .setDescription(t('en-US', 'timezone', 'getSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('timezone', 'getSubcommand'))
      .addUserOption(option => option
        .setName('user')
        .setDescription(t('en-US', 'timezone', 'userOption'))
        .setDescriptionLocalizations(getCommandLocalizations('timezone', 'userOption')))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription(t('en-US', 'timezone', 'ephemeralOption'))
        .setDescriptionLocalizations(getCommandLocalizations('timezone', 'ephemeralOption'))))
    .addSubcommand(subcommand => subcommand
      .setName('set')
      .setDescription(t('en-US', 'timezone', 'setSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('timezone', 'setSubcommand'))
      .addStringOption(option => option
        .setName('timezone')
        .setDescription(t('en-US', 'timezone', 'timezoneOption'))
        .setDescriptionLocalizations(getCommandLocalizations('timezone', 'timezoneOption'))
        .setRequired(true)
        .setAutocomplete(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'timezone');
    let command = interaction.options.getSubcommand() as 'get' | 'set' | undefined;
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    if (command === 'set') {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    } else {
      await interaction.deferReply({ flags: ephemeral });
    }
    const tzValue = interaction.options.getString('timezone');
    let member = interaction.options.getMember('user') as GuildMember | null;

    if (command === undefined) command = 'get';
    if (member === null) member = interaction.member as GuildMember;

    const response = await timezone(command, member.id, tzValue);

    const embed = embedTemplate();
    if (response === '') {
      embed.setTitle(t(locale, 'timezone', 'notSet', { name: member.displayName }));
    } else if (response === 'invalid') {
      embed.setTitle(t(locale, 'timezone', 'invalid'));
    } else if (response === 'updated') {
      embed.setTitle(t(locale, 'timezone', 'updated', { tz: tzValue }));
    } else {
      embed.setTitle(t(locale, 'timezone', 'currentTime', { time: response, name: member.displayName }));
    }
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dTimezone;
