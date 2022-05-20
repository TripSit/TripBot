'use strict';

const path = require('path');
const logger = require('../utils/logger');
const chitragupta = require('../utils/chitragupta');

const PREFIX = path.parse(__filename).name;

const {
  guildId,
  role_moderator: roleModeratorId,
  channel_start: channelStartId,
} = process.env;

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    // logger.debug(`[${PREFIX}] Reaction added`);

    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
      // If the message this reaction belongs to was removed,
      // the fetching might result in an API error which should be handled
      await reaction.fetch().catch(ex => {
        logger.error(`[${PREFIX}] reaction3:`, ex);
      });
    }

    // logger.debug(`[${PREFIX}] Reaction: ${JSON.stringify(reaction, null, 4)}`);
    if (reaction.message.channelId === channelStartId && !user.bot) {
      // This is slow as fuck, but it works
      // If we're in the start-here channel, and the user who reacted is not a bot
      await reaction.message.reactions.cache.forEach(async x => {
        // Loop through each reaction in the message
        // logger.debug(`[${PREFIX}] x.emoji.name: ${x.emoji.name}`);
        // logger.debug(`[${PREFIX}] r.emoji.name: ${reaction.emoji.name}`);
        if (x.emoji.name !== reaction.emoji.name) {
          // Look for reactions that are not the one we just added
          // logger.debug(`[${PREFIX}] Found other emoji, checking if IDS are the same`);
          // logger.debug(`[${PREFIX}] user.id: ${user.id}`);
          const reactUsers = await x.users.fetch();
          // Fetch the users who reacted to the message
          if (reactUsers.has(user.id)) {
            // If the user who reacted to the message is in the list of users
            // who reacted to the message, remove that reaction
            // logger.debug(`[${PREFIX}] Removing ${x.emoji.name} from ${reaction.message.author.username}`);
            await reaction.users.remove(user.id);
          }
        }
      });
    }
    if (user.bot) { return logger.debug(`[${PREFIX}] Ignoring bot interaction`); }
    if (reaction.message.author.bot) { return logger.debug(`[${PREFIX}] Ignoring bot interaction`); }
    const reactionAuthor = reaction.message.author;
    const reactionEmoji = reaction.emoji;
    const { count } = reaction;
    // logger.debug(`[${PREFIX}] guildId: ${guildId}`);
    // logger.debug(`[${PREFIX}] reaction.message.guild.id: ${reaction.message.guild.id}`);
    // If we're not in the TripSit guild, don't do this.
    if (reaction.message.guild.id !== guildId) { return; }
    logger.debug(`[${PREFIX}] ${user.username} gave ${reactionEmoji.name} to ${reactionAuthor.username} in ${reaction.message.guild}!`);
    await chitragupta.update(user, 1, reactionEmoji.toString(), reactionAuthor);
    if (count === 3 && reactionEmoji.name === 'ts_down') {
      if (reaction.message.member.isCommunicationDisabled()) { return; }
      logger.debug(`[${PREFIX}] ${user.username} has been downvoted three times, muting!`);
      // One week is the maximum time to mute
      const timeoutDuration = 604800000;
      reaction.message.member.timeout(timeoutDuration, `Was community quieted for saying "${reaction.message}"`);
      const moderatorRole = reaction.message.guild.roles.cache
        .find(role => role.id === roleModeratorId);
      reaction.message.reply(`Hey ${moderatorRole}s! ${reactionAuthor.username} was downvoted three times for this, please review!`);
    }
    // if (count == 3 && reaction_emoji.name == 'ts_up') {
    // eslint-disable-next-line
    //     reaction.message.channel.send(`${reaction_author.username} has been upvoted three times, great work!`);
    // }
  },
};
