import { stripIndents } from 'common-tags';
import { Composer } from 'telegraf';
import { combo } from '../../global/commands/g.combo';

const F = f(__filename);

export default Composer.command('combo', async ctx => {
  const splitCommand = ctx.update.message.text.split(' ');

  const drugA = splitCommand[1];
  const drugB = splitCommand[2];

  const data = await combo(drugA, drugB);

  log.debug(F, `data: ${data}`);

  if (data === null) {
    ctx.reply(stripIndents`${drugA} and ${drugB} have no known interactions!

    This does not mean combining them is safe: this means we don't have information on it!`);
    return;
  }

  log.debug(F, `data: ${JSON.stringify(data)}`);

  ctx.replyWithHTML(stripIndents`<b>${data.title}</b>

  ${data.description}`);

  log.debug(F, 'finished!');
});
