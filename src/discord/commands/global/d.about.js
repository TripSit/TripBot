'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/utils/logger');
const template = require('../../utils/embed-template');
const { about } = require('../../../global/utils/about');

const PREFIX = path.parse(__filename).name;

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
