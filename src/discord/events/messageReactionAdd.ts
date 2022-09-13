import {
  MessageReaction,
  User,
} from 'discord.js';
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;
import {chitragupta} from '../utils/chitragupta';
import {handleReactionRoles} from '../utils/handleReactionRoles';
import {sparklePoints} from '../utils/sparklePoints';
import {bestOf} from '../utils/bestOfTripsit';

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction: MessageReaction, user: User) {
    logger.debug(`[${PREFIX}] starting!`);
    // Only run on Tripsit
    if (reaction.message.guild?.id !== env.DISCORD_GUILD_ID.toString()) {
      return;
    }

    // Dont run on bots
    if (user.bot) {
      // logger.debug(`[${PREFIX}] Ignoring bot interaction`);
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

    // if (reaction.message.author?.bot) {
    //   logger.debug(`[${PREFIX}] Ignoring bot interaction`);
    //   return;
    // }

    // This can run on bots
    sparklePoints(reaction, user);

    handleReactionRoles(reaction, user, true);

    chitragupta(reaction, user, 1);
    bestOf(reaction, user);
    // await communityMod(reaction, user);
    // logger.debug(`[${PREFIX}] finished!`);
  },
};
