'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user, client) {
    logger.debug(`[${PREFIX}] Reaction removed`);
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
      logger.debug(`[${PREFIX}] Reaction is partial`);
      // If the message this reaction belongs to was removed, the fetching
      // might result in an API error which should be handled
      await reaction.fetch()
        .then(() => {
          logger.debug(`[${PREFIX}] reaction2:`, reaction);
          const reactionAuthor = reaction.message.author;
          const reactionEmoji = reaction.emoji;
          console.log(`${user.username} took ${reactionEmoji.name} to ${reactionAuthor.username} in ${reaction.message.guild}!`); // eslint-disable-line
          const command = client.commands.get('chitragupta');
          command.execute('chitragupta', user, -1, reactionEmoji.toString(), reactionAuthor);
        })
        .catch(err => {
          // Do something with the Error object, for example, console.error(err);
          logger.error(`[${PREFIX} ${err}] reaction3:`, reaction, err);
        });
    } else {
      // Now the message has been cached and is fully available
      const reactionAuthor = reaction.message.author;
      const reactionRemoji = reaction.emoji;
      console.log(`${user.username} took ${reactionRemoji.name} from ${reactionAuthor.username} in ${reaction.message.guild}!`); // eslint-disable-line
      const command = client.commands.get('chitragupta');
      await command.execute('chitragupta', user, -1, reactionRemoji.toString(), reactionAuthor);
    }
  },
};
