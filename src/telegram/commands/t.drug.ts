import { Composer } from 'telegraf';
import { drug } from '../../global/commands/g.drug';

const F = f(__filename);

export default Composer.command('drug', async ctx => {
  log.debug(F, `ctx.update.message.text: ${ctx.update.message.text}`);
  const splitCommand = ctx.update.message.text.split(' ');

  const command = splitCommand[0];
  const substance = splitCommand[1];

  log.debug(F, `command: ${command}`);
  log.debug(F, `substance: ${substance}`);

  let section;
  if (splitCommand.length > 2) {
    [section] = splitCommand;
    log.debug(F, `section: ${section}`);
  } else {
    log.debug(F, 'did not set section!');
  }

  log.debug(F, `starting drug(${substance}, ${section})`);

  const data = await drug(substance);

  log.debug(F, `data: ${data}`);

  ctx.replyWithHTML(JSON.stringify(data, null, 2));
});
