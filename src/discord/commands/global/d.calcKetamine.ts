import {
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { calcKetamine } from '../../../global/commands/g.calcKetamine';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dCalcKetamine;

// Calculate insufflated dosages
export const dCalcKetamine: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('calc_ketamine')
    .setDescription('Get ketamine dosage information')
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
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: (interaction.options.getBoolean('ephemeral') === true) });
    const givenWeight = interaction.options.getNumber('weight', true);

    const weightUnits = interaction.options.getString('units', true) as 'kg' | 'lbs';

    const embed = embedTemplate();
    if (weightUnits === 'kg' && givenWeight > 179) {
      embed.setTitle('Please enter a weight less than 179 kg.'); // what if a person is 200kg? =(
      await interaction.editReply({ embeds: [embed] });
      return false;
    }
    if (weightUnits === 'lbs' && givenWeight > 398) {
      embed.setTitle('Please enter a weight less than 398 lbs.');
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    const data = await calcKetamine(givenWeight, weightUnits);

    embed.addFields(
      {
        name: 'Insufflated',
        value: stripIndents`${data.insufflated}`,
        inline: true,
      },
      {
        name: 'Rectal',
        value: stripIndents`${data.rectal}`,
        inline: true,
      },
    );

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};
