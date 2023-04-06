/* eslint-disable max-len */
import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { calcBenzo } from '../../../global/commands/g.calcBenzo';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export const dCalcBenzo: SlashCommand = {
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
      .setRequired(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),

  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const dosage = interaction.options.getNumber('i_have', true);
    const drugA = interaction.options.getString('mg_of', true);
    const drugB = interaction.options.getString('and_i_want_the_dose_of', true);
    const data = await calcBenzo(dosage, drugA, drugB);

    if (data === -1) {
      await interaction.editReply({
        content: stripIndents`There was an error during conversion!
        I've let the developer know, please try again with different parameters!`,
      });
      return false;
    }

    const embed = embedTemplate()
      .setColor(Colors.Purple)
      .setTitle(`${dosage} mg of ${drugA} about equal to ${data} mg of ${drugB}`)
      .setDescription(stripIndents`
        **Please make sure to research the substances thoroughly before using them.**
        It's a good idea to start with a lower dose than the calculator shows, since everybody can react differently to different substances.
        `);
    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dCalcBenzo;
