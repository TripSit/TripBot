'use strict';

const {Composer} = require('telegraf');
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;
// const logger = require('../../global/utils/logger');
const {breathe} = require('../../global/utils/breathe');

module.exports = Composer.command('breathe', async (ctx) => {
  const splitCommand = ctx.update.message.text.split(' ');
  const choice = splitCommand[1];

  // logger.debug(`[${PREFIX}] choice: ${choice}`);

  const data = await breathe(choice);

  // logger.debug(`[${PREFIX}] data: ${data}`);

  ctx.reply(data);
});
