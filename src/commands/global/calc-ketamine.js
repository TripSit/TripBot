'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

// Calculate insufflated dosages
function generateInsufflatedDosages(weightInLbs) {
  return [
    `**Threshold**: ${Math.round(weightInLbs * 0.1)}mg`,
    `**Light**: ${Math.round(weightInLbs * 0.15)}mg`,
    `**Common**: ${Math.round(weightInLbs * 0.3)}mg`,
    `**Strong**: ${Math.round(weightInLbs * 0.5)}-${Math.round(weightInLbs * 0.75)}mg`,
    `**K-hole**: ${weightInLbs}mg`,
  ]
    .join('\n');
}

// Calculate rectal dosages
function generateRectalDosages(weightInLbs) {
  return [
    `**Threshold**: ${Math.round(weightInLbs * 0.3)}mg`,
    `**Light**: ${Math.round(weightInLbs * 0.6)}mg`,
    `**Common**: ${Math.round(weightInLbs * 0.75)}-${Math.round(weightInLbs * 2)}mg`,
    `**Strong**: ${Math.round(weightInLbs * 2)}-${Math.round(weightInLbs * 2.5)}mg`,
    `**K-hole**: ${Math.round(weightInLbs * 3)}-${Math.round(weightInLbs * 4)}mg`,
  ]
    .join('\n');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('calc_ketamine')
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
    const insufflatedosearray = generateInsufflatedDosages(calcWeight);
    const boofdosearray = generateRectalDosages(calcWeight);

    embed.addFields(
      {
        name: 'Insufflated Dosages',
        value: insufflatedosearray,
        inline: true,
      },
      {
        name: 'Rectal Dosages',
        value: boofdosearray,
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
