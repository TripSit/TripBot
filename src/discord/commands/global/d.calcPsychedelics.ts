/* eslint-disable max-len */
import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {calcPsychedelics} from '../../../global/commands/g.calcPsychedelics';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const dcalcPsychedelics: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('calc_psychedelics')
    .setDescription('Check psychedelic tolerance information')
    .addSubcommand((subcommand) => subcommand
      .setName('lsd')
      .setDescription('Check LSD tolerance information')
      .addIntegerOption((option) => option.setName('last_dose')
        .setDescription('ug of LSD')
        .setRequired(true))
      .addIntegerOption((option) => option.setName('days')
        .setDescription('Number of days since last dose?')
        .setRequired(true))
      .addIntegerOption((option) => option.setName('desired_dose')
        .setDescription('ug of LSD')))
    .addSubcommand((subcommand) => subcommand
      .setName('mushrooms')
      .setDescription('Check mushroom tolerance information')
      .addIntegerOption((option) => option.setName('last_dose')
        .setDescription('g of mushrooms')
        .setRequired(true))
      .addIntegerOption((option) => option.setName('days')
        .setDescription('Number of days since last dose?')
        .setRequired(true))
      .addIntegerOption((option) => option.setName('desired_dose')
        .setDescription('g of mushrooms'))),
  async execute(interaction) {
    const lastDose = interaction.options.getInteger('last_dose');
    const desiredDose = interaction.options.getInteger('desired_dose');
    const days = interaction.options.getInteger('days');

    const command = interaction.options.getSubcommand();

    if (!lastDose || !days || !command || !desiredDose) {
      interaction.reply({
        content: 'Something went wrong. Please try again.',
        ephemeral: true,
      });
      logger.error(`[${PREFIX}] Something went wrong. Please try again.`);
      return false;
    }


    // Code here inspired by https://codepen.io/cyberoxide/pen/BaNarGd
    // Seems like the original source is offline (https://psychedeliccalc.herokuapp.com)
    const result = await calcPsychedelics(lastDose, desiredDose, days);

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
      .setDescription(`
        This ESTIMATE only works for tryptamines (LSD and Magic Mushrooms).
        As all bodies and brains are different, results may vary. 
        [Credit to cyberoxide's Codepen](https://codepen.io/cyberoxide/pen/BaNarGd) and [AdmiralAcid's post on reddit](https://www.reddit.com/r/LSD/comments/4dzh9s/lsd_tolerance_calculator_improved/) 
      `);
    interaction.reply({embeds: [embed], ephemeral: false});

    // logger.debug(`[${PREFIX}] finished!`);
    return true;
  },
};
