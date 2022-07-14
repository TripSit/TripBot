'use strict';

const { Composer } = require('telegraf');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

module.exports = Composer.command('combochart', async ctx => {
  ctx.reply('https://i.imgur.com/juzYjDl.png');

  logger.debug(`[${PREFIX}] finish!`);
});
