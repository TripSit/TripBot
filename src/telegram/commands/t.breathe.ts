// import * as path from 'path';
// const F = f(__filename);
// const logger = require('../../global/utils/logger');
import { Composer } from 'telegraf';
import { breathe } from '../../global/commands/g.breathe';

export default Composer.command('breathe', async ctx => {
  const splitCommand = ctx.update.message.text.split(' ');
  const choice = splitCommand[1];

  // log.debug(F, `choice: ${choice}`);

  const data = await breathe(choice);

  // log.debug(F, `data: ${data}`);

  ctx.reply(data);
});
