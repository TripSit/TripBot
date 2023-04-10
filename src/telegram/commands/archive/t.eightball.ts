import { eightball } from '../../global/commands/g.eightball';
import { Composer } from 'telegraf';

const F = f(__filename);

export default Composer.command('8ball', async ctx => {
  ctx.replyWithHTML(`🎱 <b>8ball says:</b> 🎱\n${await eightball.eightball()}`);
  log.debug(F, 'finished!');
});
