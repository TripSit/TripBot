import {
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { calcMDMA } from '../../../global/commands/g.calcMDMA';
import commandContext from '../../utils/context';

const F = f(__filename);

// Calculate insufflated dosages
export const dCalcMDMA: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('calc_mdma')
    .setDescription('Get MDMA dosage information')
    .addNumberOption(option => option.setName('weight')
      .setDescription('How much do you weigh?')
      .setRequired(true))
    .addStringOption(option => option.setName('units')
      .setDescription('In what unit?')
      .addChoices(
        { name: 'kg', value: 'kg' },
        { name: 'lbs', value: 'lbs' },
      )
      .setRequired(true))
    .addBooleanOption(option => option.setName('ephemeral')
      .setDescription('Set to "True" to show the response only to you')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const givenWeight = interaction.options.getNumber('weight', true);
    const weightUnits = interaction.options.getString('units', true) as 'kg' | 'lbs';
    const embed = embedTemplate();
    const dosageData = await calcMDMA(givenWeight, weightUnits);

    let description = '**MDMA Dosage Information**\n\n';

    Object.keys(dosageData).forEach(key => {
      const title = key.charAt(0).toUpperCase() + key.slice(1);
      description += `**${title}**: ${dosageData[key as keyof typeof dosageData]}\n`;
    });

    description += '\n';

    description += stripIndents`
    **It is not recommended to exceed 150mg of MDMA in a single session, including any redoses.** \
    As dosage increases, so does the likelihood of experiencing negative side effects. \
    Keeping doses in the light to medium range can help maximize pleasurable effects while minimizing discomfort. \
    For more information check out [RollSafe](https://rollsafe.org/mdma-dosage/).`;

    await interaction.editReply({ embeds: [embed.setDescription(description)] });
    return true;
  },
};

export default dCalcMDMA;
