'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const { MessageButton, MessageActionRow } = require('discord.js');
const { stripIndents } = require('common-tags');
const logger = require('../../../global/utils/logger');

const PREFIX = path.parse(__filename).name;

const {
  channelDrugQuestionsId,
  channelSanctuaryId,
  channelGeneralId,
  channelTripsitId,
} = require('../../../../env');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tripsit-button')
    .setDescription('Creates a TripSitMe button!'),
  async execute(interaction) {
    const channelQuestions = interaction.client.channels.cache.get(channelDrugQuestionsId);
    const channelSanctuary = interaction.client.channels.cache.get(channelSanctuaryId);
    const channelGeneral = interaction.client.channels.cache.get(channelGeneralId);
    const channelTripsit = interaction.client.channels.cache.get(channelTripsitId);

    const buttonText = stripIndents`
      Welcome to the TripSit room!

      Non-urgent questions on drugs? Make a thread in ${channelQuestions}!

      Don't need immediate help but want a peaceful chat? Come to ${channelSanctuary}!

      **Need to talk with a tripsitter? Click the buttom below!**
      Share what substance you're asking about, time and size of dose, and any other relevant info.
      This will create a new thread and alert the community that you need assistance!
      🛑 Please do not message helpers or tripsitters directly! 🛑

      All other topics of conversation are welcome in ${channelGeneral}!

      Stay safe!
    `;

    // Create a new button embed
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('tripsitme')
          .setLabel('I need assistance!')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('tripsat')
          .setLabel('I\'m good now!')
          .setStyle('SUCCESS'),
      );

    // Create a new button
    await channelTripsit.send({ content: buttonText, components: [row] });
    await interaction.reply('done!');
    logger.debug(`[${PREFIX}] finished!`);
  },
};
