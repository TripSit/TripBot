/* eslint-disable max-len */
import {
  SlashCommandBuilder,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { calcSolvent, calcSubstance } from '../../../global/commands/g.calcNasal';

export default dCalcNasal;

export const dCalcNasal: SlashCommand = {

  data: new SlashCommandBuilder()
    .setName('calc_nasal') // there must be a better name for this
    .setDescription('Calculate how much of a substance or how much solvent you need to mix nose spray')
    .addSubcommand(subcommand => subcommand
      .setName('substance')
      .setDescription('Calculate how much of the substance to use for the given amount of solvent')
      .addNumberOption(option => option.setName('solvent')
        .setDescription('amount of solvent in ml')
        .setRequired(true))
      .addNumberOption(option => option.setName('mgpp')
        .setDescription('Wanted dose per push in mg')
        .setRequired(true))
      .addNumberOption(option => option.setName('mlpp')
        .setDescription('Excreted ml per push (look at the packaging)')
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(subcommand => subcommand
      .setName('solvent')
      .setDescription('Calculate how much solvent to use for the given amount of the substance')
      .addNumberOption(option => option.setName('substance')
        .setDescription('Amount of the substance in mg')
        .setRequired(true))
      .addNumberOption(option => option.setName('mgpp')
        .setDescription('Wanted dose in mg per push')
        .setRequired(true))
      .addNumberOption(option => option.setName('mlpp')
        .setDescription('Excreted ml per push (look at the packaging)')
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you'))),

  async execute(interaction) {
    const command = interaction.options.getSubcommand();

    if (command === 'solvent') {
      const ephemeral:boolean = (interaction.options.getBoolean('ephemeral') === true);
      // eslint-disable-next-line max-len
      const solvent = await calcSolvent(interaction.options.getNumber('substance') as number, interaction.options.getNumber('mgpp') as number, interaction.options.getNumber('mlpp') as number);
      const solventembed = embedTemplate().setTitle('Nasal spray calculator')
        .setDescription(`You'll need ~${solvent}ml of solvent (water)`);

      interaction.reply({ embeds: [solventembed], ephemeral });
      return true;
    }
    if (command === 'substance') {
      // eslint-disable-next-line max-len
      const ephemeral:boolean = (interaction.options.getBoolean('ephemeral') === true);
      const dose = await calcSubstance(interaction.options.getNumber('solvent') as number, interaction.options.getNumber('mgpp') as number, interaction.options.getNumber('mlpp') as number);
      const substanceembed = embedTemplate()
        .setTitle('Nasal spray calculator')
        .setDescription(`You'll need ~${dose}mg of the substance`);

      interaction.reply({ embeds: [substanceembed], ephemeral });
      return true;
    }
    return false;
  },

};
