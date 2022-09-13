'use strict';

const {Telegraf} = require('telegraf');
import * as path from 'path';
const PREFIX = path.parse(__filename).name;
const commands = require('./commands/t.index');
const logger = require('../global/utils/logger');

const {
  TELEGRAM_TOKEN,
} = require('../../env');

module.exports = {
  telegramConnect: async () => {
    logger.debug(`[${PREFIX}] Connecting to Telegram...`);

    const bot = new Telegraf(TELEGRAM_TOKEN);

    // load bot commands
    bot.use(commands);

    bot.launch();

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  },
};
