const { Composer } = require('telegraf');
const logger = require('../../global/utils/logger');
const PREFIX = require('path').parse(__filename).name;
const { about } = require('../../global/utils/about');

module.exports = Composer.command('about', async ctx => {

    const tripsitInfo = await about();

    // It says "This bot is built using the discord.js library"
    ctx.replyWithMarkdown(`
    **ℹ️ Information about TripSit ℹ️**\n\n**⚖️ Disclaimer ⚖️**\n${tripsitInfo.disclaimer}\n\n**❤️ Support TripSit ❤️**\n${tripsitInfo.support}\n\n**💬 Feedback 💬**\n${tripsitInfo.feedback}\n\n**©️ Credits ©️**\n${tripsitInfo.credits}
    `);
    logger.debug(`[${PREFIX}] finished!`);
    return;


});