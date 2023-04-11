import { Composer } from 'telegraf';
import { combochart } from '../../global/commands/g.combochart';

export default Composer.command('combochart', async ctx => {
  const url = await combochart();
  ctx.reply(url);
});
