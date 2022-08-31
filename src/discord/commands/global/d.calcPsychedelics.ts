/* eslint-disable max-len */
import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {calcPsychedelics} from '../../../global/commands/g.calcPsychedelics';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('calc-psychedelics')
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
    const lastDose = interaction.options.getInteger('last_dose')!;
    const desiredDose = interaction.options.getInteger('desired_dose');
    const days = interaction.options.getInteger('days')!;

    const command = interaction.options.getSubcommand();

    logger.debug(`[${PREFIX}] last_dose: ${lastDose} | desired_dose: ${desiredDose} | days: ${days}`);

    // Code here inspired by https://codepen.io/cyberoxide/pen/BaNarGd
    // Seems like the original source is offline (https://psychedeliccalc.herokuapp.com)
    const result = await calcPsychedelics(lastDose, desiredDose, days);

    const drug = (command === 'lsd') ? 'LSD' : 'Mushrooms';
    const units = (command === 'lsd') ? 'ug' : 'g';

    let title = `${result} ${units} of ${drug} is needed to feel the same effects as`;
    if (desiredDose) {
      title = `${title} ${desiredDose} ${units} of ${drug}.`;
    } else {
      title = `${title} your last dose.`;
    }

    const embed = embedTemplate()
        .setTitle(title)
        .setDescription(`
        Please note that this calculator only works for tryptamines like LSD and Magic Mushrooms, do not use this calculator for a chemcial that isn't a tryptamine.\n\n\
        This calculator is only able to provide an estimate. Please do not be deceived by the apparent precision of the numbers.\n\n\
        Further, this calculator also assumes that you know exactly how much LSD and Shrooms you have consumed, due to the variable nature of street LSD and Shrooms, \
        this calculator is likely to be less successful when measuring tolerance between doses from different batches/chemists and harvests.\n\n\
        As all bodies and brains are different, results may vary.
      `);
    interaction.reply({embeds: [embed], ephemeral: false});

    logger.debug(`[${PREFIX}] finished!`);
  },
};
