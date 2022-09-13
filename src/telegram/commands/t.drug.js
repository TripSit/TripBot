'use strict';

const {Composer} = require('telegraf');
import * as path from 'path';
const PREFIX = path.parse(__filename).name;
const logger = require('../../global/utils/logger');
const {drug} = require('../../global/utils/drug');

module.exports = Composer.command('drug', async (ctx) => {
  logger.debug(`[${PREFIX}] ctx.update.message.text: ${ctx.update.message.text}`);
  const splitCommand = ctx.update.message.text.split(' ');

  const command = splitCommand[0];
  const substance = splitCommand[1];

  logger.debug(`[${PREFIX}] command: ${command}`);
  logger.debug(`[${PREFIX}] substance: ${substance}`);

  let section;
  if (splitCommand.length > 2) {
    section = splitCommand[2];
    logger.debug(`[${PREFIX}] section: ${section}`);
  } else {
    logger.debug('did not set section!');
  }

  logger.debug(`[${PREFIX}] starting drug(${substance}, ${section})`);

  const data = await drug(substance, section);

  logger.debug(`[${PREFIX}] data: ${data}`);

  ctx.replyWithHTML(data);
});
