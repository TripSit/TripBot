import {
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import convert from 'convert-units';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dConvert: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('convert')
    .setNameLocalizations(getCommandLocalizations('convert', 'commandName'))
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .setDescription('Convert one unit into another')
    .setDescriptionLocalizations(getCommandLocalizations('convert', 'commandDescription'))
    .addNumberOption(option => option.setName('value')
      .setDescription(t('en', 'convert', 'valueOption'))
      .setDescriptionLocalizations(getCommandLocalizations('convert', 'valueOption'))
      .setRequired(true))
    .addStringOption(option => option.setName('units')
      .setDescription(t('en', 'convert', 'unitsOption'))
      .setDescriptionLocalizations(getCommandLocalizations('convert', 'unitsOption'))
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(option => option.setName('into')
      .setDescription(t('en', 'convert', 'intoOption'))
      .setDescriptionLocalizations(getCommandLocalizations('convert', 'intoOption'))
      .setRequired(true)
      .setAutocomplete(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription(t('en', 'convert', 'ephemeralOption'))
      .setDescriptionLocalizations(getCommandLocalizations('convert', 'ephemeralOption'))) as SlashCommandBuilder,

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'convert');
    const ephemeral = interaction.options.getBoolean('ephemeral') ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const value = interaction.options.getNumber('value', true);
    const units = interaction.options.getString('units', true);
    const intoUnits = interaction.options.getString('into', true);

    const result = convert(value).from(units as convert.Unit).to(intoUnits as convert.Unit);

    const response = t(locale, 'convert', 'result', {
      value, units, result: result.toFixed(4), intoUnits,
    });

    log.info(F, `response: ${JSON.stringify(response, null, 2)}`);

    const embed = embedTemplate()
      .setTitle(response);

    try {
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      log.error(F, `${error}`);
      await interaction.deleteReply();
      await interaction.followUp({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }
    return true;
  },
};

export default dConvert;
