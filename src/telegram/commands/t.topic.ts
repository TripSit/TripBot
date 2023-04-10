import { Composer } from 'telegraf';
import { topic } from '../../global/commands/g.topic';

export default Composer.command('topic', async ctx => {
  const data = await topic();
  ctx.reply(data);
});
