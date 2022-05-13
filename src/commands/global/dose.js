'use strict';

const path = require('path');
const { SlashCommandBuilder, time } = require('@discordjs/builders');
const logger = require('../../utils/logger');
const template = require('../../utils/embed-template');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dose')
    .setDescription('Log your dosages (offline, only you can see this)!')
    .addIntegerOption(option => option.setName('volume')
      .setDescription('How much?')
      .setRequired(true))
    .addStringOption(option => option.setName('units')
      .setDescription('What units?')
      .setRequired(true)
      .addChoice('mg (milligrams)', 'mg (milligrams)')
      .addChoice('ml (milliliters)', 'ml (milliliters)')
      .addChoice('µg (micrograms)', 'µg (micrograms)')
      .addChoice('g (grams)', 'g (grams)')
      .addChoice('oz (ounces)', 'oz (ounces)')
      .addChoice('fl oz (fluid ounces)', 'fl oz (fluid ounces)')
      .addChoice('tabs', 'tabs')
      .addChoice('caps', 'caps')
      .addChoice('pills', 'pills')
      .addChoice('drops', 'drops')
      .addChoice('sprays', 'sprays')
      .addChoice('inhales', 'inhales'))
    .addStringOption(option => option.setName('substance')
      .setDescription('What Substance?')
      .setRequired(true)
      .setAutocomplete(true)),

  async execute(interaction, parameters) {
    const substance = interaction.options.getString('substance') || parameters.at(0);
    const volume = interaction.options.getInteger('volume') || parameters.at(1);
    const units = interaction.options.getString('units') || parameters.at(2);

    const date = new Date();
    const timeString = time(date);
    const relative = time(date, 'R');

    const embed = template.embedTemplate()
      .setColor('DARK_BLUE')
      .addFields({
        name: `You dosed ${volume} ${units} of ${substance}`,
        value: `${relative} at ${timeString}`,
      });

    if (!interaction.replied) {
      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } else {
      interaction.followUp({
        embeds: [embed],
        ephemeral: false,
      });
    }
    interaction.member.send({ embeds: [embed], ephemeral: false });
    logger.debug(`[${PREFIX}] Finsihed!`);
  },
};
