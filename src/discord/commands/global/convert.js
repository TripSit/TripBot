'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const configureMeasurements = require('convert-units');
const { allMeasures } = require('convert-units');
const calcBenzo = require('../../../global/utils/calc-benzo');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');

const convert = configureMeasurements(allMeasures);

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('convert')
    .setDescription('Convert one unit into another')
    .addIntegerOption(option => option.setName('value')
      .setDescription('#')
      .setRequired(true))
    .addStringOption(option => option.setName('units')
      .setDescription('What unit?')
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(option => option.setName('intoUnits')
      .setDescription('Convert into?')
      .setRequired(true)
      .setAutocomplete(true)),

  async execute(interaction) {
    const value = interaction.options.getInteger('value');
    const units = interaction.options.getString('units');
    const intoUnits = interaction.options.getString('intoUnits');

    const result = convert(value).from(units).to(intoUnits);

    const embed = template.embedTemplate()
      .setTitle(`${value} ${units} is ${result} ${intoUnits}`)
      .setDescription(`${value} ${units} is ${result} ${intoUnits}`);
    if (interaction.replied) interaction.followUp({ embeds: [embed] });
    else interaction.reply({ embeds: [embed] });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
