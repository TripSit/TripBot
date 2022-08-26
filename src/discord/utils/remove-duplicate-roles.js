'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

const {
  CHANNEL_START,
} = require('../../../env');

module.exports = {
  async removeDuplicates(reaction, user) {
    logger.debug(`[${PREFIX}] starting!`);
    // const reactionAuthor = reaction.message.author;
    // const reactionEmoji = reaction.emoji;

    // Remove duplicate emojis
    if (reaction.message.channelId === CHANNEL_START && !user.bot) {
      // This is slow as fuck, but it works
      // If we're in the start-here channel, and the user who reacted is not a bot
      await reaction.message.reactions.cache.forEach(async x => {
        // Loop through each reaction in the message
        // logger.debug(`[${PREFIX}] x.emoji.name: ${x.emoji.name}`);
        // logger.debug(`[${PREFIX}] r.emoji.name: ${reaction.emoji.name}`);
        if (x.emoji.name !== reaction.emoji.name) {
          // Look for reactions that are not the one we just added
          // logger.debug(`[${PREFIX}] Found other emoji, checking if IDS are the same`);
          // logger.debug(`[${PREFIX}] user.id: ${user.id}`);
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
    logger.debug(`[${PREFIX}] finished!`);
  },
};
