/* eslint-disable max-len */
import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand1} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {calcBenzo} from '../../../global/commands/g.calcBenzo';
// import logger from '../../../global/utils/logger';
import {stripIndents} from 'common-tags';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const dcalcBenzo: SlashCommand1 = {
  data: new SlashCommandBuilder()
    .setName('calc_benzo')
    .setDescription('This tool helps figure out how much of a given benzo dose converts into another benzo dose.')
    .addNumberOption((option) => option.setName('i_have')
      .setDescription('mg')
      .setRequired(true))
    .addStringOption((option) => option.setName('mg_of')
      .setDescription('Pick the first benzo')
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption((option) => option.setName('and_i_want_the_dose_of')
      .setDescription('Pick the second drug')
      .setRequired(true)
      .setAutocomplete(true)),

  async execute(interaction) {
    const dosage = interaction.options.getNumber('i_have')!;
    const drugA = interaction.options.getString('mg_of')!;
    const drugB = interaction.options.getString('and_i_want_the_dose_of')!;

    const data = await calcBenzo(dosage, drugA, drugB);

    const embed = embedTemplate()
      .setColor(Colors.Purple)
      .setTitle(`${dosage} mg of ${drugA} about equal to ${data} mg of ${drugB}`)
      .setDescription(stripIndents`
        **Please make sure to research the substances thoroughly before using them.**
        It's a good idea to start with a lower dose than the calculator shows, since everybody can react differently to different substances.
        `);
    interaction.reply({embeds: [embed], ephemeral: false});
    // logger.debug(`[${PREFIX}] finished!`);
    return true;
  },
};
