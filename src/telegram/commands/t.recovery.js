'use strict';

const { Composer } = require('telegraf');
const logger = require('../../global/utils/logger');

const PREFIX = require('path').parse(__filename).name;

module.exports = Composer.command('recovery', async ctx => {

    ctx.reply('https://i.imgur.com/nTEm0QE.png');
    logger.debug(`[${PREFIX}] finished!`);

});
