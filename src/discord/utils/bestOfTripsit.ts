import {
  // Client,
  EmbedBuilder,
  Colors,
  MessageReaction,
  User,
  TextChannel,
} from 'discord.js';
import env from '../../global/utils/env.config';
import {stripIndents} from 'common-tags';
// import log from '../../global/utils/log';
// import {parse} from 'path';
// const PREFIX = parse(__filename).name;

const tripsitterChannels = [
  env.CHANNEL_TRIPSIT,
  env.CHANNEL_SANCTUARY,
  env.CHANNEL_TRIPSITMETA,
  env.CHANNEL_DRUGQUESTIONS,
  env.CHANNEL_OPENTRIPSIT1,
  env.CHANNEL_OPENTRIPSIT2,
];

// How many votes are needed for each action, in production and dev
const votePinThreshold = env.NODE_ENV === 'production' ? 5 : 2;

/**
 * This runs when there are enough upvotes on a message
 * @param {MessageReaction} reaction The reaction that was added
 * @param {User} user The user that added the reaction
 * @return {Promise<void>}
 */
export async function bestOf(reaction:MessageReaction, user:User) {
  if (reaction.count === votePinThreshold && reaction.emoji.name?.includes('upvote')) {
    // log.debug(`[${PREFIX}] Message has reached pin threshold!`);
    // Check if the message.channe.id is in the list of tripsitter channels
    if (tripsitterChannels.includes(reaction.message.channel.id)) {
      // log.debug(`[${PREFIX}] Message sent in a tripsitter channel`);
      return;
    }

    const channelObj = (reaction.message.channel as TextChannel);

    if (channelObj.parentId) {
      if (tripsitterChannels.includes(channelObj.parentId)) {
        // log.debug(`[${PREFIX}] Message sent in a tripsitter channel`);
        return;
      }
    }

    const channel = channelObj.guild.channels.cache.get(env.CHANNEL_BESTOF) as TextChannel;

    // log.debug(`[${PREFIX}] Sending message to ${channel.name}`);

    if (channel !== undefined) {
      reaction.message.reply(
        stripIndents`This got ${votePinThreshold} upvotes and has been pinned to ${channel.toString()}!`,
      );

      if (reaction.partial) await reaction.fetch();

      const date = new Date(reaction.message.createdTimestamp);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      let attachmentUrl = null;

      if (reaction.message.attachments.at(0) !== undefined) {
        attachmentUrl = reaction.message.attachments.at(0)?.url;
      }

      // log.debug(`[${PREFIX}] attachmentUrl: ${attachmentUrl}`);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: reaction.message.author?.username ?? '',
          iconURL: reaction.message.author?.displayAvatarURL(),
          url: reaction.message.url,
        })
        .setColor(Colors.Purple)
        .addFields(
          {name: '\u200B', value: `[Go to post!](${reaction.message.url})`, inline: true},
        )
        .setFooter({text: `Sent in #${(reaction.message.channel as TextChannel).name} at ${formattedDate}`});

      if (reaction.message.content) {
        embed.setDescription(reaction.message.content);
      }
      if (attachmentUrl) {
        embed.setImage(`${attachmentUrl}`);
      }

      channel.send({embeds: [embed]});
    }
  }
};
