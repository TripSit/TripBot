'use strict';

const { Composer } = require('telegraf');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

module.exports = Composer.command('breathe', async ctx => {
  const splitCommand = ctx.update.message.text.split(' ');

  const choice = splitCommand[1];

  logger.debug(`[${PREFIX}] choice: ${choice}`);

  let url;

  switch (choice) {
    case '1':
      url = 'https://i.imgur.com/n5jBp45.gif';
      break;
    case '2':

      url = 'https://i.imgur.com/XbH6gP4.gif';
      break;
    case '3':
      url = 'https://i.imgur.com/g57i96f.gif';
      break;
    case '4':
      url = 'https://i.imgur.com/MkUcTPl.gif';
      break;

    default:
      url = 'https://i.imgur.com/n5jBp45.gif';
      break;
  }

  ctx.reply(url);
});
