/* eslint-disable max-len */
import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { parse } from 'path';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { calcBenzo } from '../../../global/commands/g.calcBenzo';
import { startLog } from '../../utils/startLog';

const PREFIX = parse(__filename).name;

export default dCalcbenzo;

export const dCalcbenzo: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('calc_benzo')
    .setDescription('This tool helps figure out how much of a given benzo dose converts into another benzo dose.')
    .addNumberOption(option => option.setName('i_have')
      .setDescription('mg')
      .setRequired(true))
    .addStringOption(option => option.setName('mg_of')
      .setDescription('Pick the first benzo')
      .setAutocomplete(true)
      .setRequired(true))
    .addStringOption(option => option.setName('and_i_want_the_dose_of')
      .setDescription('Pick the second drug')
      .setAutocomplete(true)
      .setRequired(true)),

  async execute(interaction) {
    startLog(PREFIX, interaction);
    const dosage = interaction.options.getNumber('i_have', true);
    const drugA = interaction.options.getString('mg_of', true);
    const drugB = interaction.options.getString('and_i_want_the_dose_of', true);
    const data = await calcBenzo(dosage, drugA, drugB);

    if (typeof data === 'string') {
      interaction.reply({ content: data, ephemeral: true });
      return false;
    }

    const embed = embedTemplate()
      .setColor(Colors.Purple)
      .setTitle(`${dosage} mg of ${drugA} about equal to ${data} mg of ${drugB}`)
      .setDescription(stripIndents`
        **Please make sure to research the substances thoroughly before using them.**
        It's a good idea to start with a lower dose than the calculator shows, since everybody can react differently to different substances.
        `);
    interaction.reply({ embeds: [embed] });
    return true;
  },
};
