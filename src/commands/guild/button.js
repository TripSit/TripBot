'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton, MessageActionRow } = require('discord.js');
const { stripIndents } = require('common-tags');
const logger = require('../../utils/logger');

const PREFIX = path.parse(__filename).name;

const channelDrugQuestionsId = process.env.channel_drugquestions;
const channelSanctuaryId = process.env.channel_sanctuary;
const channelGeneralId = process.env.channel_general;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('button')
    .setDescription('Creates a TripSitMe button!'),
  async execute(interaction) {
    const channelQuestions = interaction.client.channels.cache.get(channelDrugQuestionsId);
    const channelSanctuary = interaction.client.channels.cache.get(channelSanctuaryId);
    const channelGeneral = interaction.client.channels.cache.get(channelGeneralId);

    const buttonText = stripIndents`Welcome to the TripSit room!\n
        Questions on drugs? Make a thread in ${channelQuestions}!\n
        Don't need immediate help but want a peaceful chat? Come to ${channelSanctuary}!\n
        **Under the influence of something and need help? Click the buttom below!**
        This will create a new thread and alert the community that you need assistance!
        🛑 Please do not message helpers or tripsitters directly! 🛑\n
        All other topics of conversation are welcome in ${channelGeneral}!\n
        Stay safe!`;

    // Create a new button embed
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('tripsitme')
          .setLabel('I need assistance!')
          .setStyle('PRIMARY'),
        // new MessageButton()
        //     .setCustomId('imgood')
        //     .setLabel('I no longer need assistance!')
        //     .setStyle('PRIMARY'),
      );

    logger.debug(`[${PREFIX}] finished!`);
  },
};
