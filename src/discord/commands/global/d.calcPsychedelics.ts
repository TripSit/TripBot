/* eslint-disable max-len */
import {
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { calcPsychedelics } from '../../../global/commands/g.calcPsychedelics';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export const dCalcPsychedelics: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('calc_psychedelics')
    .setDescription('Check psychedelic tolerance information')
    .addSubcommand(subcommand => subcommand
      .setName('lsd')
      .setDescription('Check LSD tolerance information')
      .addNumberOption(option => option.setName('last_dose')
        .setDescription('ug of LSD')
        .setRequired(true))
      .addNumberOption(option => option.setName('days')
        .setDescription('Number of days since last dose?')
        .setRequired(true))
      .addNumberOption(option => option.setName('desired_dose')
        .setDescription('ug of LSD'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you')))
    .addSubcommand(subcommand => subcommand
      .setName('mushrooms')
      .setDescription('Check mushroom tolerance information')
      .addNumberOption(option => option.setName('last_dose')
        .setDescription('g of mushrooms')
        .setRequired(true))
      .addNumberOption(option => option.setName('days')
        .setDescription('Number of days since last dose?')
        .setRequired(true))
      .addNumberOption(option => option.setName('desired_dose')
        .setDescription('g of mushrooms'))
      .addBooleanOption(option => option.setName('ephemeral')
        .setDescription('Set to "True" to show the response only to you'))),
  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    // log.debug(F, `${JSON.stringify(interaction.options, null, 2)}`);
    const lastDose = interaction.options.getNumber('last_dose', true);
    const desiredDose = interaction.options.getNumber('desired_dose');
    const days = interaction.options.getNumber('days', true);

    const command = interaction.options.getSubcommand();

    // Code here inspired by https://codepen.io/cyberoxide/pen/BaNarGd
    // Seems like the original source is offline (https://psychedeliccalc.herokuapp.com)
    const result = await calcPsychedelics(lastDose, days, desiredDose);

    const drug = (command === 'lsd') ? 'LSD' : 'Mushrooms';
    const units = (command === 'lsd') ? 'ug' : 'g';

    let title = `${result} ${units} of ${drug} is needed to feel the same effects as`;
    if (desiredDose) {
      title = `${title} ${desiredDose} ${units} of ${drug} when ${lastDose} ${units} were taken ${days} days ago.`;
    } else {
      title = `${title} ${lastDose} ${units} of ${drug} taken ${days} days ago.`;
    }

    const embed = embedTemplate()
      .setTitle(title)
      .setDescription(stripIndents`
        This ESTIMATE only works for tryptamines (LSD and Magic Mushrooms).
        As all bodies and brains are different, results may vary. 
        [Credit to cyberoxide's Codepen](https://codepen.io/cyberoxide/pen/BaNarGd) and [AdmiralAcid's post on reddit](https://www.reddit.com/r/LSD/comments/4dzh9s/lsd_tolerance_calculator_improved/) 
      `);

    await interaction.editReply({ embeds: [embed] });

    return true;
  },
};

export default dCalcPsychedelics;
