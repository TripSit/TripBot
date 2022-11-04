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

    log.debug(`${PREFIX}: ${valueInt} ${units} into ${intoUnits}`);
    const result = convert(valueInt).from(units as convert.Unit).to(intoUnits as convert.Unit);

    const embed = embedTemplate()
      .setTitle(`${value} ${units} is ${result} ${intoUnits}`);
      // .setDescription(`${value} ${units} is ${result} ${intoUnits}`);
    if (interaction.replied) interaction.followUp({embeds: [embed]});
    else interaction.reply({embeds: [embed]});
    return true;
  },
};
