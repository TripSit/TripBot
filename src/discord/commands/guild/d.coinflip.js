'use strict';

const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../../global/utils/logger');
// eslint-disable-next-line import/order
const PREFIX = require('path').parse(__filename).name;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin'),

  async execute(interaction) {
    const x = Math.floor(Math.random() * 2);
    let side;

    if (x === 0) {
      side = 'Tails';
    } else {
      side = 'Heads';
    }

    if (!interaction.replied) interaction.reply(side);
    else interaction.followUp(side);
    logger.debug(`[${PREFIX}] finished!`);
  },

};
