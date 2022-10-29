import {
  MessageReaction,
  User,
} from 'discord.js';
import {
  reactionEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
import {chitragupta} from '../utils/chitragupta';
import {handleReactionRoles} from '../utils/handleReactionRoles';
import {bestOf} from '../utils/bestOfTripsit';
// import logger from '../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

export const messageReactionAdd: reactionEvent = {
  name: 'messageReactionAdd',
  async execute(reaction: MessageReaction, user: User) {
    // logger.debug(`[${PREFIX}] starting!`);
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

    // if (reaction.message.author?.bot) {
    //   logger.debug(`[${PREFIX}] Ignoring bot interaction`);
    //   return;
    // }

    handleReactionRoles(reaction, user, true);
    chitragupta(reaction, user, 1);
    bestOf(reaction, user);
    // await communityMod(reaction, user);
    // logger.debug(`[${PREFIX}] finished!`);
  },
};
