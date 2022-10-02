/* eslint-disable max-len */
import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand1} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {calcBenzo} from '../../../global/commands/g.calcBenzo';
import logger from '../../../global/utils/logger';
import {stripIndents} from 'common-tags';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const dcalcBenzo: SlashCommand1 = {
  data: new SlashCommandBuilder()
      .setName('calc_benzo')
      .setDescription('This tool helps figure out how much of a given benzo dose converts into another benzo dose.')
      .addIntegerOption((option) => option.setName('i_have')
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
    const dosage = interaction.options.getInteger('i_have')!;
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
    // .addFields(
    //     {name: `${drugA} Summary`, value: `${data.drugAResult.properties.summary}`, inline: true},
    //     {name: `${drugB} Summary`, value: `${data.drugBResult.properties.summary}`, inline: true},
    //     {name: '\u200b', value: '\u200b', inline: true},
    //     {name: 'Effects', value: `${data.drugAResult.properties.effects}`, inline: true},
    //     {name: 'Effects', value: `${data.drugBResult.properties.effects}`, inline: true},
    //     {name: '\u200b', value: '\u200b', inline: true},
    //     {name: 'Dose', value: `${data.drugAResult.drugADosageText}`, inline: true},
    //     {name: 'Dose', value: `${data.drugBResult.drugBDosageText}`, inline: true},
    //     {name: '\u200b', value: '\u200b', inline: true},
    //     {name: 'Duration', value: `${data.drugAResult.properties.duration}`, inline: true},
    //     {name: 'Duration', value: `${data.drugBResult.properties.duration}`, inline: true},
    //     {name: '\u200b', value: '\u200b', inline: true},
    //     {name: 'After Effects', value: `${data.drugAResult.properties['after-effects']}`, inline: true},
    //     {name: 'After Effects', value: `${data.drugBResult.properties['after-effects']}`, inline: true},
    //     {name: '\u200b', value: '\u200b', inline: true},
    // );
    interaction.reply({embeds: [embed], ephemeral: false});
    logger.debug(`[${PREFIX}] finished!`);
    return true;
  },
};
