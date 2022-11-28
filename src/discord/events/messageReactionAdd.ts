// import {
//   MessageReaction,
//   User,
// } from 'discord.js';
import {
  MessageReactionAddEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
import { chitragupta } from '../utils/chitragupta';
import { handleReactionRoles } from '../utils/handleReactionRoles';
import { bestOf } from '../utils/bestOfTripsit';
// import log from '../../global/utils/log';
// import {parse} from 'path';
// const PREFIX = parse(__filename).name;

export default messageReactionAdd;

export const messageReactionAdd: MessageReactionAddEvent = {
  name: 'messageReactionAdd',
  async execute(messageReaction, user) {
    // Only run on Tripsit
    if (messageReaction.message.guild?.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    // Dont run on bots
    if (user.bot) {
      // log.debug(`[${PREFIX}] Ignoring bot interaction`);
      return;
    }

    // When a reaction is received, check if the structure is partial
    if (messageReaction.partial) await messageReaction.fetch();

    // log.info(`[${PREFIX}] ${user.username} (${user.id}) added ${reaction.emoji.name}`);

    // log.debug(`[${PREFIX}] reaction: ${JSON.stringify(reaction.emoji.name, null, 2)}`);
    // log.debug(`[${PREFIX}] users: ${JSON.stringify(reaction.users, null, 2)}`);

    // if (reaction.message.author?.bot) {
    //   // log.debug(`[${PREFIX}] Ignoring bot interaction`);
    //   return;
    // }

    handleReactionRoles(messageReaction, user, true);
    chitragupta(messageReaction, user, 1);
    bestOf(messageReaction);
    // await communityMod(reaction, user);
  },
};
