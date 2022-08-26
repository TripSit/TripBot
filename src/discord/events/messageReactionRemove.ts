import {
  MessageReaction,
  User,
} from 'discord.js';
import env from '../../global/utils/env.config';

import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;
// const { chitragupta } = require('../../global/utils/chitragupta');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction: MessageReaction, user: User) {
    // Only run on Tripsit
    if (reaction.message.guild?.id !== env.DISCORD_GUILD_ID.toString()) {
      return;
    }
    if (user.bot) {
      return;
    }
    // logger.debug(`[${PREFIX}] Reaction added`);
    // logger.debug(`[${PREFIX}] Reaction: ${JSON.stringify(reaction, null, 2)}`);
    // logger.debug(`[${PREFIX}] User: ${JSON.stringify(user, null, 2)}`);
    // logger.debug(`[${PREFIX}] Client: ${JSON.stringify(client, null, 2)}`);

    // logger.debug(`[${PREFIX}] reaction1: ${JSON.stringify(reaction, null, 4)}`);
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
      // If the message this reaction belongs to was removed,
      // the fetching might result in an API error which should be handled
      await reaction.fetch().catch((ex) => {
        logger.error(`[${PREFIX}] reaction3:`, ex);
      });
    }
    if (reaction.message.author?.bot || user.bot) {
      // logger.debug(`[${PREFIX}] Ignoring bot interaction`);
      return;
    }
    // chitragupta(reaction, user, -1);
  },
};
