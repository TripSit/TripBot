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
    // Get a random number between 0 and 1000
    const random = Math.floor(Math.random() * 1000);
    let side;

    if (random === 0) {
      side = 'The coin slipped into subspace and disappeared!';
    } else if (random === 1000) {
      side = 'The coin landed on its side!';
    } else if (random < 500) {
      side = 'Heads!';
    } else {
      side = 'Tails!';
    }

    if (!interaction.replied) interaction.reply(side);
    else interaction.followUp(side);
    logger.debug(`[${PREFIX}] finished!`);
  },

};
