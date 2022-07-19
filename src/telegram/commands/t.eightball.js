'use strict';

const { Composer } = require('telegraf');
const PREFIX = require('path').parse(__filename).name;
const eightball = require('../../global/utils/eightball');
const logger = require('../../global/utils/logger');

module.exports = Composer.command('8ball', async ctx => {
  ctx.replyWithHTML(`🎱 <b>8ball says:</b> 🎱\n${await eightball.eightball()}`);
  logger.debug(`[${PREFIX}] finished!`);
});
