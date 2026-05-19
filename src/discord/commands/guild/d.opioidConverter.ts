import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import { mainConversion } from '../../../global/utils/opioidConverter';
import { t, getLocale, getCommandLocalizations } from '../../../i18n/index';

const F = f(__filename);

export const dOpioidConverter: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('opioid')
    .setNameLocalizations(getCommandLocalizations('opioidConverter', 'commandName'))
    .setDescription(t('en-US', 'opioidConverter', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('opioidConverter', 'commandDescription'))
    .addSubcommand(subcommand => subcommand
      .setName('convert')
      .setDescription(t('en-US', 'opioidConverter', 'convertSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('opioidConverter', 'convertSubcommand'))
      .addStringOption(option => option
        .setName('from')
        .setDescription(t('en-US', 'opioidConverter', 'fromOption'))
        .setDescriptionLocalizations(getCommandLocalizations('opioidConverter', 'fromOption'))
        .setRequired(true))
      .addNumberOption(option => option
        .setName('dosage')
        .setDescription(t('en-US', 'opioidConverter', 'dosageOption'))
        .setDescriptionLocalizations(getCommandLocalizations('opioidConverter', 'dosageOption'))
        .setRequired(true))
      .addStringOption(option => option
        .setName('to')
        .setDescription(t('en-US', 'opioidConverter', 'toOption'))
        .setDescriptionLocalizations(getCommandLocalizations('opioidConverter', 'toOption'))
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const locale = await getLocale(interaction, 'opioidConverter');

    const dosage = interaction.options.getNumber('dosage', true);
    const from: string = interaction.options.getString('from', true);
    const to = interaction.options.getString('to', true);
    const result = mainConversion(dosage, from, to);

    const embed = embedTemplate()
      .setTitle(t(locale, 'opioidConverter', 'resultTitle'))
      .setColor(Colors.Blurple)
      .setDescription(t(locale, 'opioidConverter', 'resultDescription', {
        dosage, from, result, to,
      }));

    await interaction.reply({ embeds: [embed] });
    return true;
  },
};

export default dOpioidConverter;
