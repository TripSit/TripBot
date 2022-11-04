import {
  MessageReaction,
  User,
} from 'discord.js';
import log from '../../../global/utils/log';
import env from '../../../global/utils/env.config';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 * This function removes duplicate roles from the role pickers
 * @param {MessageReaction} reaction The reaction that was added
 * @param {User} user The user that added the reaction
 */
export async function removeDuplicates(reaction:MessageReaction, user:User) {
  log.debug(`[${PREFIX}] starting!`);
  // const reactionAuthor = reaction.message.author;
  // const reactionEmoji = reaction.emoji;

  // Remove duplicate emojis
  if (reaction.message.channelId === env.CHANNEL_START.toString() && !user.bot) {
    // This is slow as fuck, but it works
    // If we're in the start-here channel, and the user who reacted is not a bot
    await reaction.message.reactions.cache.forEach(async (x) => {
      // Loop through each reaction in the message
      // log.debug(`[${PREFIX}] x.emoji.name: ${x.emoji.name}`);
      // log.debug(`[${PREFIX}] r.emoji.name: ${reaction.emoji.name}`);
      if (x.emoji.name !== reaction.emoji.name) {
        // Look for reactions that are not the one we just added
        // log.debug(`[${PREFIX}] Found other emoji, checking if IDS are the same`);
        // log.debug(`[${PREFIX}] user.id: ${user.id}`);
        const reactUsers = await x.users.fetch();
        // Fetch the users who reacted to the message
        if (reactUsers.has(user.id)) {
          // If the user who reacted to the message is in the list of users
          // who reacted to the message, remove that reaction
          await reaction.users.remove(user.id);
        }
      }
    });
  }
  log.debug(`[${PREFIX}] finished!`);
};
