'use strict';

const { Composer } = require('telegraf');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');
const { combo } = require('../../global/utils/combo');

module.exports = Composer.command('combo', async ctx => {
  const splitCommand = ctx.update.message.text.split(' ');

  const drugA = splitCommand[1];
  const drugB = splitCommand[2];

  const data = await combo(drugA, drugB);

  logger.debug(`[${PREFIX}] data: ${data}`);

  if (data === null) {
    ctx.reply(`${drugA} and ${drugB} have no known interactions!\nThis does not mean combining them is safe!\nThis means we don't have information on it!`);
    return;
  }

  const [output, definition, color, thumbnail] = data;
  logger.debug(`[${PREFIX}] data: ${[output, definition, color, thumbnail]}`);

  ctx.replyWithHTML(`<b>${output}</b>\n\n${definition}`);

  logger.debug(`[${PREFIX}] finished!`);
});
