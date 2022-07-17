const Composer = require('telegraf');
const eightball = require('../../global/utils/eightball');
const logger = require('../../global/utils/logger');
const PREFIX = require('path').parse(__filename).name;

module.exports = Composer.command('8ball', async(ctx) => {

    ctx.replyWithHTML(`🎱 <b>8ball says:</b> 🎱\n${eightball.eightball}`);
    logger.debug(`[${PREFIX}] finished!`);
    return;

});