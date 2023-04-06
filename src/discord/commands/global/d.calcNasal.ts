/* eslint-disable max-len */
import {
  SlashCommandBuilder,
} from 'discord.js';

import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { calcSolvent, calcSubstance } from '../../../global/commands/g.calcNasal';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export const dCalcNasal: SlashCommand = {

  data: new SlashCommandBuilder()
    .setName('calc_nasal') // there must be a better name for this
    .setDescription('Calculate how much of a substance or how much solvent you need to mix nose spray')
    .addSubcommand(subcommand => subcommand
      .setName('substance')
      .setDescription('Calculate how much of the substance to use for the given amount of solvent')
      .addNumberOption(option => option.setName('solvent_amount')
        .setDescription('amount of solvent in ml')
        .setRequired(true))
      .addNumberOption(option => option.setName('desired_mg_per_push')
        .setDescription('Wanted dose per push in mg')
        .setRequired(true))
      .addNumberOption(option => option.setName('ml_per_push')
        .setDescription('Excreted ml per push (look at the packaging)')
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(subcommand => subcommand
      .setName('solvent')
      .setDescription('Calculate how much solvent to use for the given amount of the substance')
      .addNumberOption(option => option.setName('substance_amount')
        .setDescription('Amount of the substance in mg')
        .setRequired(true))
      .addNumberOption(option => option.setName('desired_mg_per_push')
        .setDescription('Wanted dose in mg per push')
        .setRequired(true))
      .addNumberOption(option => option.setName('ml_per_push')
        .setDescription('Excreted ml per push (look at the packaging)')
        .setRequired(true))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you'))),

  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const command = interaction.options.getSubcommand();
    const imageUrl = 'https://user-images.githubusercontent.com/1836049/218758611-c84f1e34-0f5b-43ac-90da-bd89b028f131.png';
    const embed = embedTemplate()
      .setTitle('Nasal spray calculator')
      .setImage(imageUrl);

    if (command === 'solvent') {
      // eslint-disable-next-line max-len
      // log.debug(F, `substance_amount: ${interaction.options.getNumber('substance_amount')}`);
      // log.debug(F, `desired_mg_per_push: ${interaction.options.getNumber('desired_mg_per_push')}`);
      // log.debug(F, `ml_per_push: ${interaction.options.getNumber('ml_per_push')}`);
      const solvent = await calcSolvent(
        interaction.options.getNumber('substance_amount') as number,
        interaction.options.getNumber('desired_mg_per_push') as number,
        interaction.options.getNumber('ml_per_push') as number,
      );

      embed.setDescription(`You'll need ~${solvent}ml of solvent (water)`);
    }
    if (command === 'substance') {
      // log.debug(F, `solvent_amount: ${interaction.options.getNumber('solvent_amount')}`);
      // log.debug(F, `desired_mg_per_push: ${interaction.options.getNumber('desired_mg_per_push')}`);
      // log.debug(F, `ml_per_push: ${interaction.options.getNumber('ml_per_push')}`);
      const dose = await calcSubstance(
        interaction.options.getNumber('solvent_amount') as number,
        interaction.options.getNumber('desired_mg_per_push') as number,
        interaction.options.getNumber('ml_per_push') as number,
      );
      embed.setDescription(`You'll need ~${dose}mg of the substance`);
    }
    await interaction.editReply({ embeds: [embed] });
    return true;
  },

};

export default dCalcNasal;
