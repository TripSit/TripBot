import { Composer } from 'telegraf';
import { breathe } from '../../global/commands/g.breathe';

export default Composer.command('breathe', async ctx => {
  const splitCommand = ctx.update.message.text.split(' ');
  const choice = splitCommand[1];

  const data = await breathe(choice);

  ctx.reply(data);
});
