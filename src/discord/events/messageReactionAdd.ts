// import {
//   MessageReaction,
//   User,
// } from 'discord.js';
import {
  MessageReactionAddEvent,
} from '../@types/eventDef';
import { chitragupta } from '../utils/chitragupta';
import { handleReactionRoles } from '../utils/handleReactionRoles';
import { bestOf } from '../utils/bestOfTripsit';
// import log from '../../global/utils/log';
// import {parse} from 'path';
const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

export default messageReactionAdd;

export const messageReactionAdd: MessageReactionAddEvent = {
  name: 'messageReactionAdd',
  async execute(messageReaction, user) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (messageReaction.message.guild?.id !== env.DISCORD_GUILD_ID) return;
    // log.info(F, `${user} added a reaction`);

    // Dont run on bots
    if (user.bot) {
      // log.debug(F, `Ignoring bot interaction`);
      return;
    }

    // When a reaction is received, check if the structure is partial
    if (messageReaction.partial) await messageReaction.message.fetch();

    // log.info(F, `${user.username} (${user.id}) added ${reaction.emoji.name}`);

    // log.debug(F, `reaction: ${JSON.stringify(reaction.emoji.name, null, 2)}`);
    // log.debug(F, `users: ${JSON.stringify(reaction.users, null, 2)}`);

    // if (reaction.message.author?.bot) {
    //   // log.debug(F, `Ignoring bot interaction`);
    //   return;
    // }

    handleReactionRoles(messageReaction, user, true);
    chitragupta(messageReaction, user, 1);
    bestOf(messageReaction);
    // await communityMod(reaction, user);
  },
};
