'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');

const { combo } = require('../../../global/utils/combo');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('combo')
    .setDescription('Check combo information')
    .addStringOption(option => option.setName('first_drug')
      .setDescription('Pick the first drug')
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(option => option.setName('second_drug')
      .setDescription('Pick the second drug')
      .setRequired(true)
      .setAutocomplete(true)),

  async execute(interaction, parameters) {
    const drugA = interaction.options.getString('first_drug') || parameters.at(0);
    const drugB = interaction.options.getString('second_drug') || parameters.at(1);
    logger.debug(`[${PREFIX}] drugA: ${drugA} | drugA: ${drugB}`);

    const data = await combo(drugA, drugB);

    if (data === null) {
      const embed = template.embedTemplate();
      embed.setTitle(`${drugA} and ${drugB} have no known interactions!`);
      embed.setDescription('This does not mean combining them is safe!\nThis means we don\'t have information on it!');
      interaction.reply(embed);
      return;
    }

    const [output, definition, color, thumbnail] = data;
    logger.debug(`[${PREFIX}] output: ${output}`);
    logger.debug(`[${PREFIX}] definition: ${definition}`);
    logger.debug(`[${PREFIX}] color: ${color}`);
    logger.debug(`[${PREFIX}] thumbnail: ${thumbnail}`);

    const embed = template.embedTemplate()
      .setTitle(`${drugA} and ${drugB} combined:`);

    embed.addFields(
      { name: 'Result', value: output },
      { name: 'Definition', value: definition },
    );
    embed.setThumbnail(thumbnail);
    embed.setColor(color);

    if (interaction.replied) interaction.followUp({ embeds: [embed] });
    else interaction.reply({ embeds: [embed] });
  },
};
