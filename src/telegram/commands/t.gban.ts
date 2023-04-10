import { stripIndents } from 'common-tags';
import { Composer } from 'telegraf';
import fs from 'fs';

const F = f(__filename);

export default Composer.command('gban', async ctx => {
  // check if the chat the command was executed in is a group or channel
  if (ctx.update.message.chat.type === 'private') {
    ctx.replyWithHTML(stripIndents`❌ <b>Task failed successfully!</b> ❌

    This command can't be executed in private chats`);
    log.debug(F, 'failed! Tried to execute in private chat.');
    return;
  }

  // Get a list of all admins in the chat
  const chatAdmins = await ctx.getChatAdministrators();
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
    const moderatedChats = JSON.parse(fs.readFileSync(`${__dirname}/../cache/moderatedChats.json`, 'utf8'));

    if (moderatedChats.includes(ctx.update.message.chat.id)) {
      // let originalMessage;
      // check if command was executed in response to a message
      // TODO: originalMessage is never populated, figure out what this is supposed to do
      // if (originalMessage === ctx.update.message || ctx.update.message.reply_to_message) {
      //   // This needs to happen syncronysly to ensure the user is banned from each channel
      //   // eslint-disable-next-line no-restricted-syntax
      //   // for (const i of moderatedChats) {
      //   //   ctx.telegram.banChatMember(i, originalMessage.from.id);
      //   //   log.debug(F, `banned user #${originalMessage.from.id} from chat #${i}`);
      //   // }
      //   ctx.replyWithHTML(stripIndents`✅ <b>Check!</b> ✅

      //   I banned the user from all the groups i moderate.`);
      //   log.debug(F, 'finished!');
      // } else {
      //   // this seems to don't be a response.
      //   ctx.replyWithHTML(stripIndents`❌ <b>Task failed successfully! </b>❌

      //   You have to execute /ban as a response to a message. If you did and you still see this error, please contact @whyamiinthisroom`);
      //   log.debug(F, 'failed! update.reply_to_message not set.');
      //   log.debug(F, `reply_to_message: ${ctx.update.message.reply_to_message}`);
      // }
    } else {
      ctx.replyWithHTML(stripIndents`❌ <b>Task failed successfully!</b> ❌

      You don't have the required permission to use this command.`);
      log.debug(F, 'failed! Required permission missing.');
    }
  } else {
    ctx.replyWithHTML(stripIndents`❌ <b>Task failed successfully!</b> ❌

    This group is not moderated by tripbot!`);
  }
});
