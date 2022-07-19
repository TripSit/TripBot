'use strict';

const { Composer } = require('telegraf');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

module.exports = Composer.command('recovery', async ctx => {
  ctx.reply('https://i.imgur.com/nTEm0QE.png');
  logger.debug(`[${PREFIX}] finished!`);
});
