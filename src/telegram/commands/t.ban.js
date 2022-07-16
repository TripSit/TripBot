'use strict';

const { Composer } = require('telegraf');
const { stripIndents } = require('common-tags');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

module.exports = Composer.command('ban', async ctx => {
  // check if the chat the command was executed in is a group or channel
  if (ctx.update.message.chat.type === 'private') {
    ctx.replyWithHTML(stripIndents`❌ <b>Task failed successfully!</b> ❌

    This command can't be executed in private chats`);
    logger.debug(`[${PREFIX}] failed! Tried to execute in private chat.`);
    return;
  }

  // Get a list of all admins in the chat
  const chatAdmins = await ctx.getChatAdministrators(ctx.chat.id);
  // Get a list of IDs of HUMAN admins in the chat
  const chatAdminIds = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const i of chatAdmins) {
    if (!i.user.is_bot) {
      chatAdminIds.push(i.user.id);
    }
  }

  // check if the user executing the command is a group administrator
  if (chatAdminIds.includes(ctx.update.message.from.id)) {
    let originalMessage;
    // check if command was executed in response to a message
    if (originalMessage === ctx.update.reply_to_message || ctx.update.message.reply_to_message) {
      if (originalMessage.from.id === await ctx.telegram.getMe().id) {
        ctx.replyWithHTML(stripIndents`❌ <b>Task failed successfully!</b> ❌

        I can't ban myself.`);
        logger.debug(`[${PREFIX}] failed! Will not ban myself.`);
        return;
      }

      if (!chatAdminIds.includes(originalMessage.from.id) && originalMessage.from.id) {
        ctx.banChatMember(originalMessage.from.id);
        ctx.replyWithHTML(stripIndents`✅ <b>Check!</b> ✅

        I banned this user for you`);
        logger.debug(`[${PREFIX}] finished!`);
      } else {
        ctx.replyWithHTML(stripIndents`❌ <b>Task failed successfully!</b> ❌

        Sorry, i can't ban an administrator`);
        logger.debug(`[${PREFIX}] failed! Can't ban administrator`);
      }
    } else {
      // this seems to don't be a response.
      ctx.replyWithHTML(stripIndents`❌ <b>Task failed successfully! </b>❌

      You have to execute /ban as a response to a message. If you did and you still see this error, please contact @whyamiinthisroom`);
      logger.logger(`[${PREFIX}] failed! update.reply_to_message not set.`);
      logger.logger(`[${PREFIX}] reply_to_message: ${ctx.update.message.reply_to_message}`);
    }
  } else {
    ctx.replyWithHTML(stripIndents`❌ <b>Task failed successfully!</b> ❌\n
    You don't have the required permission to use this command.`);
    logger.debug(`[${PREFIX}] failed! Required permission missing.`);
  }
});
