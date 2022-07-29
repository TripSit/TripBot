'use strict';

const PREFIX = require('path').parse(__filename).name;
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const { about } = require('../../../global/utils/about');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Shows information about this bot!'),
  async execute(interaction) {
    const tripsitInfo = await about();
    const embed = template.embedTemplate()
      .setColor('DARK_BLUE')
      .setTitle('About TripSit')
      .setURL('https://tripsit.me/about/')
      .setDescription(tripsitInfo.description)
      .addFields(
        {
          name: 'Disclaimer',
          value: tripsitInfo.disclaimer,
        },
        {
          name: 'Support TripSit',
          value: tripsitInfo.support,
        },
        {
          name: 'Feedback',
          value: tripsitInfo.feedback,
        },
        {
          name: 'Credits',
          value: tripsitInfo.credits,
        },
      );
    if (interaction.replied) interaction.followUp({ embeds: [embed] });
    else interaction.reply({ embeds: [embed] });
    logger.debug(`[${PREFIX}] finished!`);
  },
};
