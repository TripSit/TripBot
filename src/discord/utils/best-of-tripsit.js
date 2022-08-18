'use strict';

const PREFIX = require('path').parse(__filename).name;
const {
  EmbedBuilder,
  Colors,
} = require('discord.js');
const { stripIndents } = require('common-tags/lib');
const logger = require('../../global/utils/logger');

const {
  NODE_ENV,
  channelBestOfTripsitId,
  channelTripsitId,
  channelSanctuaryId,
  channelTripsittersId,
  channelHowToTripsitId,
  channelDrugQuestionsId,
  channelOpentripsitId,
} = require('../../../env');

const tripsitterChannels = [
  channelTripsitId,
  channelSanctuaryId,
  channelTripsittersId,
  channelHowToTripsitId,
  channelDrugQuestionsId,
  channelOpentripsitId,
];

// How many votes are needed for each action, in production and dev
const votePinThreshold = NODE_ENV === 'production' ? 5 : 1;

module.exports = {
  async bestOf(reaction /* , user */) {
    logger.debug(`[${PREFIX}] starting!`);

    if (reaction.count === votePinThreshold && reaction.emoji.name.includes('upvote')) {
      // Check if the message.channe.id is in the list of tripsitter channels
      if (tripsitterChannels.includes(reaction.message.channel.id)
        || tripsitterChannels.includes(reaction.message.channel.parentId)) {
        // logger.debug(`[${PREFIX}] Message sent in a tripsitter channel`);
        return;
      }

      const channel = reaction.message.channel.guild.channels.cache.get(channelBestOfTripsitId);

      reaction.message.reply(stripIndents`This got ${votePinThreshold} upvotes and has been pinned to ${channel.toString()}!`);

      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      const date = new Date(reaction.message.createdTimestamp);
      const formattedDate = date.toLocaleDateString('en-US', options);
      let attachmentUrl = null;
      try {
        attachmentUrl = reaction.message.attachments.at(0).url;
      } catch (e) {
        logger.debug(`[${PREFIX}] No attachment found`);
      }

      logger.debug(`[${PREFIX}] attachmentUrl: ${attachmentUrl}`);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: reaction.message.author.username,
          iconURL: reaction.message.author.displayAvatarURL(),
          url: reaction.message.url,
        })
        .setColor(Colors.Purple)
        .setDescription(reaction.message.content)
        .addFields(
          { name: '\u200B', value: `[Go to post!](${reaction.message.url})`, inline: true },
        )
        .setFooter({ text: `Sent in #${reaction.message.channel.name} at ${formattedDate}` });

      if (attachmentUrl) {
        embed.setImage(`${attachmentUrl}`);
      }

      channel.send({ embeds: [embed] });
    }

    logger.debug(`[${PREFIX}] finished!`);
  },
};
