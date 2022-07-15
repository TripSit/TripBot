'use strict';

const { info } = require('console');
const { Composer } = require('telegraf');
const logger = require('../../global/utils/logger');

const PREFIX = require('path').parse(__filename).name;

module.exports = Composer.command('ban', async ctx => {

    let originalMessage = ctx.update.message.reply_to_message
    let userId;

    const splitCommand = ctx.update.message.text.split(' ');
    const username = splitCommand[1];

    const chatAdmins = await ctx.getChatAdministrators(ctx.chat.id);
    let chatAdminIds = [];

    // Make an array with all the userIds of all admins
    for(const i of chatAdmins) {
        if(!i.user.is_bot) {
            chatAdminIds.push(i.user.id);
        }
    }

    // Check if user executing the command is a group administrator
    if(chatAdminIds.includes(ctx.from.id)) {

    // check if the command was executed as a response to a message. if so, ban the user who sent the original message.
    if(originalMessage) {
        userId = originalMessage.from.id;
        ctx.banChatMember(ctx.chat.id, userId);
        ctx.replyWithHTML("<b>✅ Success!</b>\nI banned this user for you.");
        logger.debug(`[${PREFIX}] finished!`);
        return;
    } else {
        ctx.replyWithHTML(`❌ <b>Task failed successfully! ❌\nPlease use this command as response to a message of the user you would like to ban”`);
        logger.debug(`[${PREFIX}] finished! Wrong usage of command, aborted.`);
    }

    } else {
        ctx.replyWithHTML(`❌ <b>Task failed successfully!</b> ❌\nSorry, only chat admins are allowed to execute this command! Your id is ${ctx.from.id}`);
        logger.debug(`[${PREFIX}] finished! Access to command denied.`);
        return;
    }


});

