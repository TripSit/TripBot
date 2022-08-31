/* eslint-disable max-len */
import {
  Colors,
  SlashCommandBuilder,
} from 'discord.js';
import {SlashCommand} from '../../utils/commandDef';
import {embedTemplate} from '../../utils/embedTemplate';
import logger from '../../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

const dxmData:DxmDataType = {
  First: {min: 1.5, max: 2.5},
  Second: {min: 2.5, max: 7.5},
  Third: {min: 7.5, max: 15},
  Fourth: {min: 15, max: 20},
};

type DxmDataType = {
  First: {min: number, max: number};
  Second: {min: number, max: number};
  Third: {min: number, max: number};
  Fourth: {min: number, max: number};
};

export const discordTemplate: SlashCommand = {
  data: new SlashCommandBuilder()
      .setName('calc-dxm')
      .setDescription('Get DXM dosage information')
      .addIntegerOption((option) => option.setName('calc_weight')
          .setDescription('How much do you weigh?')
          .setRequired(true))
      .addStringOption((option) => option.setName('units')
          .setDescription('In what units?')
          .setRequired(true)
          .addChoices(
              {name: 'kg', value: 'kg'},
              {name: 'lbs', value: 'lbs'},
          ))
      .addStringOption((option) => option.setName('taking')
          // eslint-disable-next-line max-len
          .setDescription('What are you taking? All products listed here contain DXM hBr as the sole active ingredient.')
          .setRequired(true)
          .addChoices(
              {name: 'RoboTablets (30 mg tablets)', value: 'RoboTablets (30 mg tablets)'},
              {name: 'RoboCough (ml)', value: 'RoboCough (ml)'},
              {name: 'Robitussin DX (oz)', value: 'Robitussin DX (oz)'},
              {name: 'Robitussin DX (ml)', value: 'Robitussin DX (ml)'},
              {name: 'Robitussin Gelcaps (15 mg caps)', value: 'Robitussin Gelcaps (15 mg caps)'},
              {name: 'Pure (mg)', value: 'Pure (mg)'},
              {name: '30mg Gelcaps (30 mg caps)', value: '30mg Gelcaps (30 mg caps)'},
          )),
  async execute(interaction) {
    // Calculate each plat min/max value
    const givenWeight = interaction.options.getInteger('calc_weight')!;
    logger.debug(`[${PREFIX}] calc_weight:`, givenWeight);

    const weightUnits = interaction.options.getString('units');
    logger.debug(`[${PREFIX}] weight_units:`, weightUnits);

    let calcWeight = weightUnits === 'lbs' ? givenWeight * 0.453592 : givenWeight;
    logger.debug(`[${PREFIX}] calc_weight:`, calcWeight);

    const taking = interaction.options.getString('taking');
    logger.debug(`[${PREFIX}] taking:`, taking);

    let roaValue = 0;
    let units = '';
    if (taking === 'RoboCough (ml)') {
      roaValue = 10;
      units = '(ml)';
    } else if (taking === 'Robitussin DX (oz)') {
      roaValue = 88.5;
      units = '(oz)';
    } else if (taking === 'Robitussin DX (ml)') {
      roaValue = 3;
      units = '(ml)';
    } else if (taking === 'Robitussin Gelcaps (15 mg caps)') {
      roaValue = 15;
      units = '(15 mg caps)';
    } else if (taking === 'Pure (mg)') {
      roaValue = 1;
      units = '(mg)';
    } else if (taking === '30mg Gelcaps (30 mg caps)') {
      roaValue = 30;
      units = '(30 mg caps)';
    } else if (taking === 'RoboTablets (30 mg tablets)') {
      roaValue = 40.9322;
      units = '(30 mg tablets)';
    }

    logger.debug(`[${PREFIX}] roaValue:`, roaValue);
    logger.debug(`[${PREFIX}] units:`, units);

    calcWeight /= roaValue;
    logger.debug(`[${PREFIX}] calcWeight:`, calcWeight);

    const embed = embedTemplate()
        .setColor(Colors.Purple)
        .setTitle('DXM Calculator')
        .setDescription(`
        Please note, these tools were developed and tested to the best possible ability by the TripSit team, and the greatest effort has been made not to produce incorrect or misleading results, though for unforeseen reasons these may occur. Always check your maths, and be careful.\n\n\
        You should always start low and work your way up untill you find the doses that are right for you.\n\n\
        DXM-containing products may also contain several potentially dangerous adulterants; you must make sure that your product contains only DXM as its active ingredient. For more information about DXM adulterants, see: https://wiki.tripsit.me/wiki/DXM#Adulteration\n\n\
        For a description of the plateau model, and the effects you can expect at each level, click: https://wiki.tripsit.me/wiki/DXM#Plateaus
      `);

    // Loop through the keys in dxm_data and calculate the min/max values

    Object.keys(dxmData).forEach((key) => {
      const min = Math.round((dxmData[key as keyof DxmDataType].min * calcWeight) * 100) / 100;
      const max = Math.round((dxmData[key as keyof DxmDataType].max * calcWeight) * 100) / 100;
      embed.addFields(
          {name: 'Plateau', value: `${key}`, inline: true},
          {name: 'Minimum', value: `${min} ${units}`, inline: true},
          {name: 'Maximum', value: `${max} ${units}`, inline: true},
      );
    });
    if (!interaction.replied) {
      interaction.reply({
        embeds: [embed],
        ephemeral: false,
      });
    } else {
      interaction.followUp({
        embeds: [embed],
        ephemeral: false,
      });
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
