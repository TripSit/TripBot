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
// import log from '../../global/utils/log';
// import {parse} from 'path';
// const PREFIX = parse(__filename).name;

export const messageReactionAdd: reactionEvent = {
  name: 'messageReactionAdd',
  async execute(reaction: MessageReaction, user: User) {
    // Only run on Tripsit
    if (reaction.message.guild?.id !== env.DISCORD_GUILD_ID.toString()) {
      return;
    }

    // Dont run on bots
    if (user.bot) {
      // log.debug(`[${PREFIX}] Ignoring bot interaction`);
      return;
    }

    // When a reaction is received, check if the structure is partial
    if (reaction.partial) await reaction.fetch();

    // log.info(`[${PREFIX}] ${user.username} (${user.id}) added ${reaction.emoji.name}`);

    // log.debug(`[${PREFIX}] reaction: ${JSON.stringify(reaction.emoji.name, null, 2)}`);
    // log.debug(`[${PREFIX}] users: ${JSON.stringify(reaction.users, null, 2)}`);

    // if (reaction.message.author?.bot) {
    //   // log.debug(`[${PREFIX}] Ignoring bot interaction`);
    //   return;
    // }

    handleReactionRoles(reaction, user, true);
    chitragupta(reaction, user, 1);
    bestOf(reaction, user);
    // await communityMod(reaction, user);
  },
};
