// import {
//   MessageReaction,
//   User,
// } from 'discord.js';
import type { MessageReactionAddEvent } from '../@types/eventDef';

import { aiReaction } from '../commands/global/d.ai';
import { bestOf } from '../utils/bestOfTripsit';
import { chitragupta } from '../utils/chitragupta';
// import log from '../../global/utils/log';
// import {parse} from 'path';
const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

export const messageReactionAdd: MessageReactionAddEvent = {
  async execute(messageReaction, user) {
    try {
      await messageReaction.fetch();
    } catch {
      // log.error(F, 'Failed to fetch messageReaction');
      // return;
    }

    try {
      await messageReaction.message.fetch(); // Get the message object so that we can do stuff between restarts
    } catch {
      // log.error(F, 'Failed to fetch message data');
      // return;
    }

    if (!messageReaction.message.guild) {
      return;
    } // Ignore DMs
    // log.info(F, stripIndents`${user} added ${messageReaction.emoji.name} on to \
    //     ${messageReaction.message.author?.displayName}'s message`);
    // AI audit stuff comes first cuz this can happen on other guilds
    await aiReaction(messageReaction, user);

    // Only run the rest on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (messageReaction.message.guild?.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    // Don't run on bots
    if (user.bot) {
      // log.debug(F, `Ignoring bot interaction`);
      return;
    }

    chitragupta(messageReaction, user, 1);
    bestOf(messageReaction);
    // await communityMod(reaction, user);
  },
  name: 'messageReactionAdd',
};

export default messageReactionAdd;
