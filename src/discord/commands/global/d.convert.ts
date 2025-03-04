import {
  SlashCommandBuilder,
} from 'discord.js';
import convert from 'convert-units';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export const dConvert: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('convert')
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .setDescription('Convert one unit into another')
    .addNumberOption(option => option.setName('value')
      .setDescription('#')
      .setRequired(true))
    .addStringOption(option => option.setName('units')
      .setDescription('What unit?')
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(option => option.setName('into')
      .setDescription('Convert into?')
      .setRequired(true)
      .setAutocomplete(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')) as SlashCommandBuilder,

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const value = interaction.options.getNumber('value', true);
    const units = interaction.options.getString('units', true);
    const intoUnits = interaction.options.getString('into', true);

    const result = convert(value).from(units as convert.Unit).to(intoUnits as convert.Unit);

    const response = `${value} ${units} is ${result.toFixed(4)} ${intoUnits}`;

    log.info(F, `response: ${JSON.stringify(response, null, 2)}`);

    const embed = embedTemplate()
      .setTitle(response);

    try {
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      log.error(F, `${error}`);
      await interaction.deleteReply();
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    }
    return true;
  },
};

export default dConvert;
