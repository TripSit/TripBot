import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
import convert from 'convert-units';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

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
    const value = parseFloat(interaction.options.getString('value')!);
    const units = interaction.options.getString('units')!;
    const intoUnits = interaction.options.getString('into_units')!;

    if (Number.isNaN(value)) {
      if (interaction.replied) interaction.followUp('You must enter a number.');
      else interaction.reply('You must enter a number.');
      return;
    }

    logger.debug(`${PREFIX}: ${value} ${units} into ${intoUnits}`);
    const result = convert(value).from(units as convert.Unit).to(intoUnits as convert.Unit);

    const embed = embedTemplate()
        .setTitle(`${value} ${units} is ${result} ${intoUnits}`);
      // .setDescription(`${value} ${units} is ${result} ${intoUnits}`);
    if (interaction.replied) interaction.followUp({embeds: [embed]});
    else interaction.reply({embeds: [embed]});
    logger.debug(`[${PREFIX}] finished!`);
  },
};
