'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const calcKetamine = require('../../../global/utils/calc-ketamine');

const PREFIX = path.parse(__filename).name;

// Calculate insufflated dosages

module.exports = {
  data: new SlashCommandBuilder()
    .setName('calc-ketamine')
    .setDescription('Get ketamine dosage information')
    .addIntegerOption(option => option.setName('weight')
      .setDescription('How much do you weigh?')
      .setRequired(true))
    .addStringOption(option => option.setName('units')
      .setDescription('In what unit?')
      .setRequired(true)
      .addChoice('kg', 'kg')
      .addChoice('lbs', 'lbs')),

  async execute(interaction, parameters) {
    const givenWeight = interaction.options.getInteger('weight') || parameters.at(0);
    logger.debug(`[${PREFIX}] weight:`, givenWeight);

    const weightUnits = interaction.options.getString('units') || parameters.at(1);
    logger.debug(`[${PREFIX}] weightUnits:`, weightUnits);

    const calcWeight = weightUnits === 'kg' ? givenWeight * 2.20462 : givenWeight;
    logger.debug(`[${PREFIX}] calcWeight:`, calcWeight);

    const embed = template.embedTemplate();
    if (weightUnits === 'kg' && givenWeight > 179) {
      embed.setTitle('Please enter a valid weight less than 179 kg.');
      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
    if (weightUnits === 'lbs' && givenWeight > 398) {
      embed.setTitle('Please enter a valid weight less than 398 lbs.');
      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    const data = await calcKetamine.calc(givenWeight, weightUnits);

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

    return logger.debug(`[${PREFIX}] finished!`);
  },
};
