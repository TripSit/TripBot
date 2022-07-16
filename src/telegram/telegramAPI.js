'use strict';

const { Telegraf } = require('telegraf');
const PREFIX = require('path').parse(__filename).name;
const commands = require('./commands/t.index');
const logger = require('../global/utils/logger');

const {
  TELEGRAM_TOKEN,
} = require('../../env');
const { info } = require('console');

module.exports = {
  telegramConnect: async () => {
    logger.debug(`[${PREFIX}] Connecting to Telegram...`);

    const bot = new Telegraf(TELEGRAM_TOKEN);

    // load bot commands
    bot.use(commands);

    bot.launch();

    const errorMessages = [
      'Task failed successfully! 👍', '🤖 TripBot smoked too much pot and fell asleep. Please try again later.', 'Huh, what was that❓ Even my dog can code better! 🐶\nReach out and help us fixing this. :)', "😔 Sorry, i don't know this command.", '🤖 Beep boop beep-- something went wrong.',
    ];

    /**bot.on("message", async (ctx) => {
      if (!ctx.update.text.startsWith('/')) return;
      bot.reply(errorMessages[Math.floor(Math.random() * errorMessages.length())]);
    })**/

    bot.on("message", async (ctx) => {
      console.log(ctx.update);
    })

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  },
};
