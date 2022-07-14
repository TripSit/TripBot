'use strict';

const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/utils/logger');

const PREFIX = path.parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recovery')
    .setDescription('Information that may be helpful in a serious situation.'),

  async execute(interaction) {
    const url = 'https://i.imgur.com/nTEm0QE.png';
    if (!interaction.replied) interaction.reply(url);
    else interaction.followUp(url);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
