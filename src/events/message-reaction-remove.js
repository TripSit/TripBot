'use strict';

const path = require('path');
const logger = require('../utils/logger');
const chitragupta = require('../utils/chitragupta');

const PREFIX = path.parse(__filename).name;

const {
  discordGuildId,
  roleModeratorId,
} = require('../../env');

module.exports = {
  name: 'messageReactionRemove',
  async execute(reaction, user) {
    // Only run on Tripsit
    if (reaction.message.guild.id !== discordGuildId) { return; }
    if (user.bot) { return; }
    // logger.debug(`[${PREFIX}] Reaction added`);
    // logger.debug(`[${PREFIX}] Reaction: ${JSON.stringify(reaction, null, 2)}`);
    // logger.debug(`[${PREFIX}] User: ${JSON.stringify(user, null, 2)}`);
    // logger.debug(`[${PREFIX}] Client: ${JSON.stringify(client, null, 2)}`);

    // logger.debug(`[${PREFIX}] reaction1: ${JSON.stringify(reaction, null, 4)}`);
    // When a reaction is received, check if the structure is partial
    if (reaction.partial) {
      // If the message this reaction belongs to was removed,
      // the fetching might result in an API error which should be handled
      await reaction.fetch().catch(ex => {
        logger.error(`[${PREFIX}] reaction3:`, ex);
      });
    }
    if (reaction.message.author.bot || user.bot) {
      // logger.debug(`[${PREFIX}] Ignoring bot interaction`);
      return;
    }
    const reactionAuthor = reaction.message.author;
    const reactionEmoji = reaction.emoji;
    const { count } = reaction;
    // logger.debug(`[${PREFIX}] discordGuildId: ${discordGuildId}`);
    // logger.debug(`[${PREFIX}] reaction.message.guild.id: ${reaction.message.guild.id}`);
    // If we're not in the TripSit guild, don't do this.
    if (reaction.message.guild.id !== discordGuildId) { return; }
    logger.debug(`[${PREFIX}] ${user.username} gave ${reactionEmoji.name} to ${reactionAuthor.username} in ${reaction.message.guild}!`);
    await chitragupta.update(user, -1, reactionEmoji.toString(), reactionAuthor);
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
