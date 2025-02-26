import {
  // Client,
  EmbedBuilder,
  Colors,
  MessageReaction,
  TextChannel,
} from 'discord.js';
import { stripIndents } from 'common-tags';
// import log from '../../global/utils/log';
// import {parse} from 'path';
// const F = f(__filename);

const ignoredCategories = [
  env.CATEGORY_TEAMTRIPSIT,
  env.CATEGORY_HARMREDUCTIONCENTRE,
];

// How many votes are needed for each action, in production and dev
const votePinThreshold = env.NODE_ENV === 'production' ? 5 : 1;

export default bestOf;

/**
 * This runs when there are enough upvotes on a message
 * @param {MessageReaction} reaction The reaction that was added
 * @param {User} user The user that added the reaction
 * @return {Promise<void>}
 */
export async function bestOf(reaction:MessageReaction): Promise<void> {
  if (reaction.count === votePinThreshold && reaction.emoji.name?.includes('upvote')) {
    if (reaction.message.partial) await reaction.message.fetch();

    const channelObj = (reaction.message.channel as TextChannel);

    if (channelObj.parentId && ignoredCategories.includes(channelObj.parentId)) {
      // log.debug(F, `Message sent in an ignored channel`);
      return;
    }

    if (!reaction.message.author) return;

    const existingEntry = await db.best_of.findUnique({
      where: { message_id: reaction.message.id },
    });

    if (existingEntry) return;

    // Create the entry since it doesn't exist yet
    await db.best_of.create({
      data: {
        user_id: reaction.message.author.id,
        message_id: reaction.message.id,
        channel_id: channelObj.id,
        sent_at: new Date(),
        last_updated: new Date(),
      },
    });

    const channelBestof = await channelObj.guild.channels.fetch(env.CHANNEL_BESTOF) as TextChannel;

    // log.debug(F, `Sending message to ${channel.name}`);

    if (channelBestof !== undefined) {
      reaction.message.reply(
        stripIndents`This got ${votePinThreshold} upvotes and has been pinned to ${channelBestof.toString()}!`,
      );

      if (reaction.partial) await reaction.fetch();

      const date = new Date(reaction.message.createdTimestamp);
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const attachmentUrl = reaction.message.attachments.at(0) !== undefined
        ? reaction.message.attachments.at(0)?.url
        : null;

      const embedUrl = reaction.message.embeds.at(0)?.thumbnail !== undefined
        ? reaction.message.embeds.at(0)?.thumbnail?.url
        : null;

      // log.debug(F, `attachmentUrl: ${attachmentUrl}`);

      const embed = new EmbedBuilder()
        .setAuthor({
          name: reaction.message.author?.username ?? '',
          iconURL: reaction.message.author?.displayAvatarURL(),
          url: reaction.message.url,
        })
        .setColor(Colors.Purple)
        .addFields(
          { name: '\u200B', value: `[Go to post!](${reaction.message.url})`, inline: true },
        )
        .setFooter({ text: `Sent in #${(reaction.message.channel as TextChannel).name} at ${formattedDate}` });

      if (reaction.message.content && !embedUrl) {
        embed.setDescription(reaction.message.content);
      }

      if (attachmentUrl) {
        embed.setImage(`${attachmentUrl}`);
      }

      if (embedUrl) {
        embed.setImage(`${embedUrl}`);
      }

      await channelBestof.send({ embeds: [embed] });
    }
  }
}
