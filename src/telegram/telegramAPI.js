'use strict';

const { Telegraf } = require('telegraf');
const PREFIX = require('path').parse(__filename).name;
const commands = require('./commands');
const logger = require('../global/utils/logger');

const {
  TELEGRAM_TOKEN,
} = require('../../env');

module.exports = {
  telegramConnect: async () => {
    logger.debug(`[${PREFIX}] TELEGRAM_TOKEN: ${TELEGRAM_TOKEN}`);

    const bot = new Telegraf(TELEGRAM_TOKEN);

    // load bot commands
    bot.use(commands);

    bot.launch();

    const errorMessages = [
      'Task failed successfully! 👍', '🤖 TripBot smoked too much pot and fell asleep. Please try again later.', 'Huh, what was that❓ Even my dog can code better! 🐶\nReach out and help us fixing this. :)', "😔 Sorry, i don't know this command.", '🤖 Beep boop beep-- something went wrong.',
    ];

    const m = `${errorMessages.sort(() => 0.5 - Math.random()).slice(0, 30).join(' ')}`;
    bot.on('text', ctx => ctx.reply(errorMessages[Math.floor(Math.random() * errorMessages.length)]));

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  },
};
