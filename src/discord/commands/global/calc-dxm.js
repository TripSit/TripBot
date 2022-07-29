'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

const dxmData = {
  First: { min: 1.5, max: 2.5 },
  Second: { min: 2.5, max: 7.5 },
  Third: { min: 7.5, max: 15 },
  Fourth: { min: 15, max: 20 },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('calc-dxm')
    .setDescription('Get DXM dosage information')
    .addIntegerOption(option => option.setName('calc_weight')
      .setDescription('How much do you weigh?')
      .setRequired(true))
    .addStringOption(option => option.setName('units')
      .setDescription('In what units?')
      .setRequired(true)
      .addChoice('kg', 'kg')
      .addChoice('lbs', 'lbs'))
    .addStringOption(option => option.setName('taking')
      .setDescription('What are you taking? All products listed here contain DXM hBr as the sole active ingredient.')
      .setRequired(true)
      .addChoice('RoboTablets (30 mg tablets)', 'RoboTablets (30 mg tablets)')
      .addChoice('RoboCough (ml)', 'RoboCough (ml)')
      .addChoice('Robitussin DX (oz)', 'Robitussin DX (oz)')
      .addChoice('Robitussin DX (ml)', 'Robitussin DX (ml)')
      .addChoice('Robitussin Gelcaps (15 mg caps)', 'Robitussin Gelcaps (15 mg caps)')
      .addChoice('Pure (mg)', 'Pure (mg)')
      .addChoice('30mg Gelcaps (30 mg caps)', '30mg Gelcaps (30 mg caps)')),
  async execute(interaction, parameters) {
    // Calculate each plat min/max value
    const givenWeight = interaction.options.getInteger('calc_weight') || parameters.at(0);
    logger.debug(`[${PREFIX}] calc_weight:`, givenWeight);

    const weightUnits = interaction.options.getString('units') || parameters.at(1);
    logger.debug(`[${PREFIX}] weight_units:`, weightUnits);

    let calcWeight = weightUnits === 'lbs' ? givenWeight * 0.453592 : givenWeight;
    logger.debug(`[${PREFIX}] calc_weight:`, calcWeight);

    const taking = interaction.options.getString('taking') || parameters.at(2);
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

    const embed = template.embedTemplate()
      .setColor('RANDOM')
      .setTitle('DXM Calculator')
      .setDescription(`
        Please note, these tools were developed and tested to the best possible ability by the TripSit team, and the greatest effort has been made not to produce incorrect or misleading results, though for unforeseen reasons these may occur. Always check your maths, and be careful.\n\n\
        You should always start low and work your way up untill you find the doses that are right for you.\n\n\
        DXM-containing products may also contain several potentially dangerous adulterants; you must make sure that your product contains only DXM as its active ingredient. For more information about DXM adulterants, see: https://wiki.tripsit.me/wiki/DXM#Adulteration\n\n\
        For a description of the plateau model, and the effects you can expect at each level, click: https://wiki.tripsit.me/wiki/DXM#Plateaus
      `);

    // Loop through the keys in dxm_data and calculate the min/max values
    for (const key in dxmData) { // eslint-disable-line
      const min = Math.round((dxmData[key].min * calcWeight) * 100) / 100;
      const max = Math.round((dxmData[key].max * calcWeight) * 100) / 100;
      embed.addFields(
        { name: 'Plateau', value: `${key}`, inline: true },
        { name: 'Minimum', value: `${min} ${units}`, inline: true },
        { name: 'Maximum', value: `${max} ${units}`, inline: true },
      );
    }
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
