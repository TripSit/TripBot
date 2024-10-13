// import {
//   MessageReaction,
//   User,
// } from 'discord.js';
import {
  MessageReactionRemoveEvent,
} from '../@types/eventDef';
import { chitragupta } from '../utils/chitragupta';

const F = f(__filename);

export const messageReactionRemove: MessageReactionRemoveEvent = {
  name: 'messageReactionRemove',
  async execute(reaction, user) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (reaction.message.guild?.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `${user.displayName}(${user.id}) removed a reaction`);

    // log.debug(F, `reaction: ${JSON.stringify(reaction.emoji.name, null, 2)}`);
    // log.debug(F, `user: ${JSON.stringify(user, null, 2)}`);

    if (user.bot) {
      return;
    }
    // log.debug(F, `Reaction added`);
    // log.debug(F, `Reaction: ${JSON.stringify(reaction, null, 2)}`);
    // log.debug(F, `User: ${JSON.stringify(user, null, 2)}`);
    // log.debug(F, `Client: ${JSON.stringify(client, null, 2)}`);

    // log.debug(F, `reaction1: ${JSON.stringify(reaction, null, 4)}`);
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
      // log.debug(F, `reaction is partial!`);
      // If the message this reaction belongs to was removed,
      // the fetching might result in an API error which should be handled
      await reaction.fetch().catch(ex => {
        log.error(F, `reaction3: ${JSON.stringify(ex, null, 4)}`);
      });
    }

    // log.info(F, `${user.username} (${user.id}) removed ${reaction.emoji.name}`);

    // if (reaction.message.author?.bot) {
    //   // log.debug(F, `Ignoring bot interaction`);
    //   return;
    // }
    chitragupta(reaction, user, -1);
  },
};

export default messageReactionRemove;
