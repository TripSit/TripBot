'use strict';

const { Composer } = require('telegraf');
const fs = require('fs');
const { stripIndents } = require('common-tags');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

module.exports = Composer.command('moderatechat', async ctx => {
  // check if the chat the command was executed in is a group or channel
  if (ctx.update.message.chat.type === 'private') {
    ctx.replyWithHTML(stripIndents`❌ <b>Task failed successfully!</b> ❌\n
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

  if (chatAdminIds.includes(ctx.update.message.from.id)) {
    try {
      const moderatedChats = JSON.parse(fs.readFileSync(`${__dirname}/../cache/moderatedChats.json`));

      if (!moderatedChats.includes(ctx.update.message.chat.id)) {
        moderatedChats.push(ctx.update.message.chat.id);
        fs.writeFileSync(`${__dirname}/../cache/moderatedChats.json`, JSON.stringify(moderatedChats), { encoding: 'utf8' });
        ctx.replyWithHTML(stripIndents`✅ <b>Check!</b> ✅\n
        This group is moderated by tripbot now.\n
        This allows the administrators of this group to use the /gban command and users /gban'ned in other chats moderated by tripbot will get banned in this chat too.`);
      } else {
        ctx.replyWithHTML(stripIndents`❌ <b>Task failed successfully!</b> ❌\n
        This group is already moderated by TripBot. There's no need to execute the command again.`);
        logger.debug(`[${PREFIX}] finished! Group already moderated by tripbot`);
        return;
      }
    } catch (err) {
      logger.error(`[${PREFIX}] err: ${err}`);
    }
  } else {
    ctx.replyWithHTML(stripIndents`❌ <b>Task failed successfully!</b> ❌\n
    You don't have the required permission to execute this command.`);
    logger.debug(`[${PREFIX}] failed! Required permission missing.`);
  }
});
