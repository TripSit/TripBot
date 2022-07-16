'use strict';

const { Composer } = require('telegraf');
const { combochart } = require('../../global/utils/combochart');

module.exports = Composer.command('combochart', async ctx => {
  const url = await combochart();
  ctx.reply(url);
});
