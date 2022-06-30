'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger');
const { karma } = require('../utils/chitragupta');
const { communityMod } = require('../utils/community-mod');
const { sparklePoints } = require('../utils/sparkle-points');
const { removeDuplicates } = require('../utils/remove-duplicate-roles');
const { bestOf } = require('../utils/best-of-tripsit');

const {
  discordGuildId,
} = require('../../env');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    // Only run on Tripsit
    if (reaction.message.guild.id !== discordGuildId) { return; }

    // logger.debug(`[${PREFIX}] Reaction added`);
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
      // If the message this reaction belongs to was removed,
      // the fetching might result in an API error which should be handled
      await reaction.fetch().catch(ex => {
        logger.error(`[${PREFIX}] reaction3:`, ex);
      });
    }

    removeDuplicates(reaction, user);

    // This can run on bots
    await sparklePoints(reaction, user);

    // Dont run on bots
    if (reaction.message.author.bot || user.bot) {
      // logger.debug(`[${PREFIX}] Ignoring bot interaction`);
      return;
    }

    await karma(reaction, user, 1);
    await bestOf(reaction, user);
    await communityMod(reaction, user);
  },
};
