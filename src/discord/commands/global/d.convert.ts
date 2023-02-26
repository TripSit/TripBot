import {
  SlashCommandBuilder,
} from 'discord.js';
import convert from 'convert-units';
import { SlashCommand } from '../../@types/commandDef';
import { startLog } from '../../utils/startLog';
import { embedTemplate } from '../../utils/embedTemplate';

const F = f(__filename);

export default dConvert;

export const dConvert: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('convert')
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
      .setDescription('Set to "True" to show the response only to you')),

  async execute(interaction) {
    startLog(F, interaction);
    const value = interaction.options.getNumber('value', true);
    const units = interaction.options.getString('units', true);
    const intoUnits = interaction.options.getString('into', true);

    const result = convert(value).from(units as convert.Unit).to(intoUnits as convert.Unit);

    const response = `${value} ${units} is ${result.toFixed(4)} ${intoUnits}`;

    log.info(F, `response: ${JSON.stringify(response, null, 2)}`);

    const embed = embedTemplate()
      .setTitle(response);

    const ephemeral:boolean = (interaction.options.getBoolean('ephemeral') === true);

    interaction.reply({ embeds: [embed], ephemeral });
    return true;
  },
};
