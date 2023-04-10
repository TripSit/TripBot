import { Telegraf as TelegramClient } from 'telegraf';

const commands = require('./commands/t.index');

const F = f(__filename);

export default async function telegramConnect() {
  log.debug(F, 'Connecting to Telegram...');

  const bot = new TelegramClient(env.TELEGRAM_TOKEN);

  // load bot commands
  bot.use(commands);

  bot.launch();

  global.telegramClient = bot;

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

declare global {
  var telegramClient: TelegramClient; // eslint-disable-line
}
