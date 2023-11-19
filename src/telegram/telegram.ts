import { Telegraf } from 'telegraf';
import commands from './commands/t.index';

const F = f(__filename);

export default async function telegramConnect() {
  log.debug(F, 'Connecting to Telegram...');

  const bot = new Telegraf(env.TELEGRAM_TOKEN);

  // load bot commands
  bot.use(...commands);

  bot.launch();

  bot.catch((err: any) => {
    log.error(F, `Error in Telegram bot: ${err}`);
  });

  global.telegramClient = bot;

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

declare global {
  var telegramClient: Telegraf;
}
