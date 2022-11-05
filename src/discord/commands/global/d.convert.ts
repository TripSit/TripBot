import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {startLog} from '../../utils/startLog';
import {embedTemplate} from '../../utils/embedTemplate';
import log from '../../../global/utils/log';
import convert from 'convert-units';

import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const convertUnits: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('convert')
    .setDescription('Convert one unit into another')
    .addStringOption((option) => option.setName('value')
      .setDescription('#')
      .setRequired(true))
    .addStringOption((option) => option.setName('units')
      .setDescription('What unit?')
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption((option) => option.setName('into_units')
      .setDescription('Convert into?')
      .setRequired(true)
      .setAutocomplete(true)),

  async execute(interaction) {
    startLog(PREFIX, interaction);
    const value = interaction.options.getString('value', true);
    const valueInt = parseFloat(value);
    const units = interaction.options.getString('units', true);
    const intoUnits = interaction.options.getString('into_units', true);

    if (Number.isNaN(valueInt)) {
      if (interaction.replied) interaction.followUp('You must enter a number.');
      else interaction.reply('You must enter a number.');
      return false;
    }

    const result = convert(valueInt).from(units as convert.Unit).to(intoUnits as convert.Unit);

    const response = `${value} ${units} is ${result} ${intoUnits}`;

    log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);

    const embed = embedTemplate()
      .setTitle(response);

    interaction.reply({embeds: [embed]});
    return true;
  },
};