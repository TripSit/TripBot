// import {
//   MessageReaction,
//   User,
// } from 'discord.js';
import {
  MessageReactionAddEvent,
} from '../@types/eventDef';
import { chitragupta } from '../utils/chitragupta';
import { bestOf } from '../utils/bestOfTripsit';
import { updatePollEmbed } from '../commands/global/d.poll';
import { aiReaction } from '../commands/global/d.ai';
import { tripsitReaction } from '../commands/guild/d.tripsit';
// import log from '../../global/utils/log';
// import {parse} from 'path';
const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

export const messageReactionAdd: MessageReactionAddEvent = {
  name: 'messageReactionAdd',
  async execute(messageReaction, user) {
    try {
      await messageReaction.fetch();
    } catch (e) {
      // log.error(F, 'Failed to fetch messageReaction');
      // return;
    }

    try {
      await messageReaction.message.fetch(); // Get the message object so that we can do stuff between restarts
    } catch (e) {
      // log.error(F, 'Failed to fetch message data');
      // return;
    }

    if (!messageReaction.message.guild) return; // Ignore DMs
    // log.info(F, stripIndents`${user} added ${messageReaction.emoji.name} on to \
    //     ${messageReaction.message.author?.displayName}'s message`);
    // AI audit stuff comes first cuz this can happen on other guilds
    await aiReaction(messageReaction, user);

    // Only run the rest on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (messageReaction.message.guild?.id !== env.DISCORD_GUILD_ID) return;

    // Don't run on bots
    if (user.bot) {
      // log.debug(F, `Ignoring bot interaction`);
      return;
    }

    chitragupta(messageReaction, user, 1);
    bestOf(messageReaction);
    updatePollEmbed(messageReaction);
    tripsitReaction(messageReaction, user);
    // await communityMod(reaction, user);
  },
};

export default messageReactionAdd;
