import { Composer } from 'telegraf';

const F = f(__filename);

export default Composer.command('recovery', async ctx => {
  ctx.reply('https://i.imgur.com/nTEm0QE.png');
  log.debug(F, 'finished!');
});
