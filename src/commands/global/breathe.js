'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('breathe')
    .setDescription('Remember to breathe')
    .addStringOption(option => option.setName('exercise')
      .setDescription('Which exercise?')
      .addChoice('1', '1')
      .addChoice('2', '2')
      .addChoice('3', '3')
      .addChoice('4', '4')),

  async execute(interaction, parameters) {
    const choice = interaction.options.getString('exercise') || parameters;
    let url;
    if (choice === '1' || !choice) {
      url = 'https://i.imgur.com/n5jBp45.gif';
    } else if (choice === '2') {
      url = 'https://i.imgur.com/XbH6gP4.gif';
    } else if (choice === '3') {
      url = 'https://i.imgur.com/g57i96f.gif';
    } else if (choice === '4') {
      url = 'https://i.imgur.com/MkUcTPl.gif';
    }

    if (interaction.replied) interaction.followUp(url);
    else interaction.reply(url);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
