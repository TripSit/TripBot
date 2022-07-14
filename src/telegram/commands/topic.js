'use strict';

const { Composer } = require('telegraf');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

const topics = require('../../global/assets/data/topics.json');

module.exports = Composer.command('topic', async ctx => {
  logger.debug(`[${PREFIX}] started!`);
  ctx.reply(topics[Math.floor(Math.random() * Object.keys(topics).length).toString()]);
  logger.debug(`[${PREFIX}] finished!`);
});
