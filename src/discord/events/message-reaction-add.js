'use strict';

// const PREFIX = require('path').parse(__filename).name;
// const logger = require('../../global/utils/logger');
const { chitragupta } = require('../../global/utils/chitragupta');
// const { communityMod } = require('../utils/community-mod');
const { handleReactionRoles } = require('../utils/handleReactionRoles');
const { sparklePoints } = require('../utils/sparkle-points');
const { bestOf } = require('../utils/best-of-tripsit');

const {
  discordGuildId,
  channelStartId,
} = require('../../../env');

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    // Only run on Tripsit
    if (reaction.message.guild.id !== discordGuildId) { return; }

    // When a reaction is received, check if the structure is partial
    if (reaction.partial) await reaction.fetch();
    await reaction.users.fetch();

    // logger.debug(`[${PREFIX}] reaction: ${JSON.stringify(reaction.emoji.name, null, 2)}`);
    // logger.debug(`[${PREFIX}] users: ${JSON.stringify(reaction.users, null, 2)}`);
    // {
    //   "messageId": "1001828599172702218",
    //   "me": false,
    //   "users": [
    //     "177537158419054592"
    //   ],
    //   "count": 1,
    //   "emojiId": "958721361587630210"
    // }

    if (reaction.message.channelId === channelStartId && !user.bot) {
      await handleReactionRoles(reaction, user);
    }

    // This can run on bots
    await sparklePoints(reaction, user);

    // Dont run on bots
    if ((reaction.message.author.bot || user.bot) && reaction.emoji.name !== 'karma_downvote') {
      // logger.debug(`[${PREFIX}] Ignoring bot interaction`);
      return;
    }

    await chitragupta(reaction, user, 1);
    await bestOf(reaction, user);
    // await communityMod(reaction, user);
  },
};
