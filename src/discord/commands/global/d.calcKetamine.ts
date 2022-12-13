import {
  SlashCommandBuilder,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { calcKetamine } from '../../../global/commands/g.calcKetamine';
import { startLog } from '../../utils/startLog';
// import log from '../../../global/utils/log';
const F = f(__filename);

export default dCalcketamine;

// Calculate insufflated dosages
export const dCalcketamine: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('calc_ketamine')
    .setDescription('Get ketamine dosage information')
    .addNumberOption(option => option.setName('weight')
      .setDescription('How much do you weigh?')
      .setRequired(true))
    .addStringOption(option => option.setName('units')
      .setDescription('In what unit?')
      .setRequired(true)
      .addChoices(
        { name: 'kg', value: 'kg' },
        { name: 'lbs', value: 'lbs' },
      )),
  async execute(interaction) {
    startLog(F, interaction);
    const givenWeight = interaction.options.getNumber('weight');
    if (!givenWeight) {
      interaction.reply({
        content: 'Something went wrong. Please try again.',
        ephemeral: true,
      });
      // log.debug(F, `weight: ${givenWeight}`);
      return false;
    }
    // log.debug(F, `weight: ${givenWeight}`);

    const weightUnits = interaction.options.getString('units') as 'kg' | 'lbs';
    if (!weightUnits) {
      interaction.reply({
        content: 'Something went wrong. Please try again.',
        ephemeral: true,
      });
      // log.debug(F, `weightUnits: ${weightUnits}`);
      return false;
    }

    // log.debug(F, `weightUnits: ${weightUnits}`);

    // const calcWeight = weightUnits === 'kg' ? givenWeight * 2.20462 : givenWeight;
    // // log.debug(F, `calcWeight: ${calcWeight}`);

    const embed = embedTemplate();
    if (weightUnits === 'kg' && givenWeight > 179) {
      embed.setTitle('Please enter a valid weight less than 179 kg.');
      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
      return false;
    }
    if (weightUnits === 'lbs' && givenWeight > 398) {
      embed.setTitle('Please enter a valid weight less than 398 lbs.');
      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
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

    interaction.reply({ embeds: [embed] });
    return true;
  },
};
