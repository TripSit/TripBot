'use strict';

const { info } = require('console');
const { Composer } = require('telegraf');
const logger = require('../../global/utils/logger');

const PREFIX = require('path').parse(__filename).name;

module.exports = Composer.command('ban', async ctx => {

    // check if the chat the command was executed in is a group or channel
    if (ctx.update.message.chat.type === 'private') { 
        ctx.replyWithHTML(`❌ <b>Task failed successfully!</b> ❌\nThis command can't be executed in private chats`);
        logger.debug(`[${PREFIX}] failed! Tried to execute in private chat.`);
        return;
    }




        // Get a list of all userids from group admins
        const chatAdmins = await ctx.getChatAdministrators(ctx.chat.id);
        let chatAdminIds = [];
        for (const i of chatAdmins) {
            if (!i.user.is_bot) {
                chatAdminIds.push(i.user.id);
            }
        }

        // check if the user executing the command is a group administrator
        if (chatAdminIds.includes(ctx.update.message.from.id)) {

            let originalMessage;
            // check if command was executed in response to a message
            if (originalMessage = ctx.update.reply_to_message || ctx.update.message.reply_to_message) {


                if(originalMessage.from.id == await ctx.telegram.getMe().id) {
                    ctx.replyWithHTML(`❌ <b>Task failed successfully!</b> ❌\nI can't ban myself.`);
                    logger.debug(`[${PREFIX}] failed! Will not ban myself.`);
                    return;
                }

                if (!chatAdminIds.includes(originalMessage.from.id) && originalMessage.from.id ) {

                    ctx.banChatMember(originalMessage.from.id);
                    ctx.replyWithHTML(`✅ <b>Check!</b> ✅\nI banned this user for you`);
                    logger.debug(`[${PREFIX}] finished!`);

                    return;

                } else {

                    ctx.replyWithHTML(`❌ <b>Task failed successfully!</b> ❌\nSorry, i can't ban an administrator`);
                    logger.debug(`[${PREFIX}] failed! Can't ban administrator`);
                    return;

                }

            } else {
                // this seems to don't be a response. 
                ctx.replyWithHTML(`❌ <b>Task failed successfully! </b>❌\nYou have to execute /ban as a response to a message. If you did and you still see this error, please contact @whyamiinthisroom`);
                logger.debug(`[${PREFIX}] failed! update.reply_to_message not set.`);
                console.log(ctx.update.message.reply_to_message);
                return;

            }

        } else {
            ctx.replyWithHTML(`❌ <b>Task failed successfully!</b> ❌\nYou don't have the required permission to use this command.`);
            logger.debug(`[${PREFIX}] failed! Required permission missing.`)
            return;
        }




});

