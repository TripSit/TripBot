import {
  MessageReaction,
  User,
} from 'discord.js';
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;
// const { chitragupta } = require('../../global/utils/chitragupta');
// const { communityMod } = require('../utils/community-mod');
import {handleReactionRoles} from '../utils/handleReactionRoles';
// const { sparklePoints } = require('../utils/sparkle-points');
// const {bestOf} = require('../utils/bestOfTripsit');
import {bestOf} from '../utils/bestOfTripsit';

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction: MessageReaction, user: User) {
    logger.debug(`[${PREFIX}] starting!`);
    // Only run on Tripsit
    if (reaction.message.guild?.id !== env.DISCORD_GUILD_ID.toString()) {
      return;
    }

    // When a reaction is received, check if the structure is partial
    if (reaction.partial) await reaction.fetch();

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

    await handleReactionRoles(reaction, user, true);

    // This can run on bots
    // await sparklePoints(reaction, user);

    // Dont run on bots
    if ((reaction.message.author?.bot || user.bot) && reaction.emoji.name !== 'karma_downvote') {
      // logger.debug(`[${PREFIX}] Ignoring bot interaction`);
      return;
    }

    // await chitragupta(reaction, user, 1);
    await bestOf(reaction, user);
    // await communityMod(reaction, user);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
