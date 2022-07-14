'use strict';

const { Composer } = require('telegraf');
const { topic } = require('../../global/utils/topic');

module.exports = Composer.command('topic', async ctx => {
  const data = await topic();
  ctx.reply(data);
});
