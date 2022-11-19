// import {
//   MessageReaction,
//   User,
// } from 'discord.js';
import { parse } from 'path';
import {
  MessageReactionRemoveEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
import { handleReactionRoles } from '../utils/handleReactionRoles';
import { chitragupta } from '../utils/chitragupta';
import log from '../../global/utils/log';

const PREFIX = parse(__filename).name;

export default messageReactionRemove;

export const messageReactionRemove: MessageReactionRemoveEvent = {
  name: 'messageReactionRemove',
  async execute(reaction, user) {
    // Only run on Tripsit
    if (reaction.message.guild?.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    // log.debug(`[${PREFIX}] reaction: ${JSON.stringify(reaction.emoji.name, null, 2)}`);
    // log.debug(`[${PREFIX}] user: ${JSON.stringify(user, null, 2)}`);

    if (user.bot) {
      return;
    }
    // log.debug(`[${PREFIX}] Reaction added`);
    // log.debug(`[${PREFIX}] Reaction: ${JSON.stringify(reaction, null, 2)}`);
    // log.debug(`[${PREFIX}] User: ${JSON.stringify(user, null, 2)}`);
    // log.debug(`[${PREFIX}] Client: ${JSON.stringify(client, null, 2)}`);

    // log.debug(`[${PREFIX}] reaction1: ${JSON.stringify(reaction, null, 4)}`);
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
      // log.debug(`[${PREFIX}] reaction is partial!`);
      // If the message this reaction belongs to was removed,
      // the fetching might result in an API error which should be handled
      await reaction.fetch().catch(ex => {
        log.error(`[${PREFIX}] reaction3: ${JSON.stringify(ex, null, 4)}`);
      });
    }

    // log.info(`[${PREFIX}] ${user.username} (${user.id}) removed ${reaction.emoji.name}`);

    await handleReactionRoles(reaction, user, false);

    // if (reaction.message.author?.bot) {
    //   // log.debug(`[${PREFIX}] Ignoring bot interaction`);
    //   return;
    // }
    chitragupta(reaction, user, -1);
  },
};
