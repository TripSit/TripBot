import {
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand1} from '../../@types/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import {calcKetamine} from '../../../global/commands/g.calcKetamine';
import logger from '../../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

// Calculate insufflated dosages
export const dCalcKetamine: SlashCommand1 = {
  data: new SlashCommandBuilder()
      .setName('calc_ketamine')
      .setDescription('Get ketamine dosage information')
      .addIntegerOption((option) => option.setName('weight')
          .setDescription('How much do you weigh?')
          .setRequired(true))
      .addStringOption((option) => option.setName('units')
          .setDescription('In what unit?')
          .setRequired(true)
          .addChoices(
              {name: 'kg', value: 'kg'},
              {name: 'lbs', value: 'lbs'},
          )),
  async execute(interaction) {
    const givenWeight = interaction.options.getInteger('weight')!;
    // logger.debug(`[${PREFIX}] weight: ${givenWeight}`);

    const weightUnits = interaction.options.getString('units')! as 'kg' | 'lbs';
    // logger.debug(`[${PREFIX}] weightUnits: ${weightUnits}`);

    // const calcWeight = weightUnits === 'kg' ? givenWeight * 2.20462 : givenWeight;
    // // logger.debug(`[${PREFIX}] calcWeight: ${calcWeight}`);

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
          name: 'Insufflated Dosages',
          value: data.insufflated,
          inline: true,
        },
        {
          name: 'Rectal Dosages',
          value: data.rectal,
          inline: true,
        },
    );

    interaction.reply({embeds: [embed], ephemeral: false});
    logger.debug(`[${PREFIX}] finished!`);
    return true;
  },
};
