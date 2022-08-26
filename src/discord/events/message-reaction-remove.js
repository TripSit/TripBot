'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');
const { chitragupta } = require('../../global/utils/chitragupta');

const {
  DISCORD_GUILD_ID,
} = require('../../../env');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user) {
    // Only run on Tripsit
    if (reaction.message.guild.id !== DISCORD_GUILD_ID) { return; }
    if (user.bot) { return; }
    // logger.debug(`[${PREFIX}] Reaction added`);
    // logger.debug(`[${PREFIX}] Reaction: ${JSON.stringify(reaction, null, 2)}`);
    // logger.debug(`[${PREFIX}] User: ${JSON.stringify(user, null, 2)}`);
    // logger.debug(`[${PREFIX}] Client: ${JSON.stringify(client, null, 2)}`);

    // logger.debug(`[${PREFIX}] reaction1: ${JSON.stringify(reaction, null, 4)}`);
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
      // If the message this reaction belongs to was removed,
      // the fetching might result in an API error which should be handled
      await reaction.fetch().catch(ex => {
        logger.error(`[${PREFIX}] reaction3:`, ex);
      });
    }
    if (reaction.message.author.bot || user.bot) {
      // logger.debug(`[${PREFIX}] Ignoring bot interaction`);
      return;
    }
    chitragupta(reaction, user, -1);
  },
};
