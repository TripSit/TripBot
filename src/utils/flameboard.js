'use strict';

const PREFIX = require('path').parse(__filename).name;
const { MessageEmbed } = require('discord.js');
const { stripIndents } = require('common-tags/lib');
const logger = require('./logger');

const {
  NODE_ENV,
  channelFlameboardId,
} = require('../../env');

// How many votes are needed for each action, in production and dev
const votePinThreshold = NODE_ENV === 'production' ? 3 : 1;

module.exports = {
  async flameboard(reaction, user) {
    logger.debug(`[${PREFIX}] starting!`);

    if (reaction.count === votePinThreshold && reaction.emoji.name.includes('upvote')) {
      const channel = reaction.message.channel.guild.channels.cache.get(channelFlameboardId);

      reaction.message.reply(stripIndents`This got ${votePinThreshold} upvotes and has been pinned to ${channel.toString()}!`);

      const embed = new MessageEmbed()
        .setAuthor({
          name: reaction.message.author.username,
          iconURL: reaction.message.author.displayAvatarURL(),
          url: reaction.message.url,
        })
        .setColor('RANDOM')
        .setDescription(reaction.message.content);

      channel.send({ embeds: [embed] });
    }

    logger.debug(`[${PREFIX}] finished!`);
  },
};
