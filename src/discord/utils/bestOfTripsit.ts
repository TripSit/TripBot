import type { MessageReaction, TextChannel } from 'discord.js';

import { stripIndents } from 'common-tags';
import {
  Colors,
  // Client,
  EmbedBuilder,
} from 'discord.js';
// import log from '../../global/utils/log';
// import {parse} from 'path';
// const F = f(__filename);

const ignoredCategories = new Set([env.CATEGORY_HARMREDUCTIONCENTRE, env.CATEGORY_TEAMTRIPSIT]);

// How many votes are needed for each action, in production and dev
const votePinThreshold = env.NODE_ENV === 'production' ? 5 : 1;

export default bestOf;

/**
 * This runs when there are enough upvotes on a message
 * @param {MessageReaction} reaction The reaction that was added
 * @param {User} user The user that added the reaction
 * @return {Promise<void>}
 */
export async function bestOf(reaction: MessageReaction): Promise<void> {
  if (reaction.count === votePinThreshold && reaction.emoji.name?.includes('upvote')) {
    if (reaction.message.partial) {
      await reaction.message.fetch();
    }

    let channelObject = reaction.message.channel;

    channelObject = channelObject.isThread()
      ? (channelObject.parent as TextChannel)
      : (channelObject as TextChannel);

    if (!channelObject) {
      return;
    }

    if (
      (channelObject.parentId && ignoredCategories.has(channelObject.parentId)) ||
      channelObject.id === env.CHANNEL_HELPERLOUNGE
    ) {
      // log.debug(F, `Message sent in an ignored channel or thread`);
      return;
    }

    if (!reaction.message.author) {
      return;
    }

    const existingEntry = await db.best_of.findUnique({
      where: { message_id: reaction.message.id },
    });

    if (existingEntry) {
      return;
    }

    // Create the entry since it doesn't exist yet
    await db.best_of.create({
      data: {
        channel_id: channelObject.id,
        last_updated: new Date(),
        message_id: reaction.message.id,
        sent_at: new Date(),
        user_id: reaction.message.author.id,
      },
    });

    const channelBestof = (await channelObject.guild.channels.fetch(
      env.CHANNEL_BESTOF,
    )) as TextChannel;

    // log.debug(F, `Sending message to ${channel.name}`);

    if (channelBestof !== undefined) {
      reaction.message.reply(
        stripIndents`This got ${votePinThreshold} upvotes and has been pinned to ${channelBestof.toString()}!`,
      );

      if (reaction.partial) {
        await reaction.fetch();
      }

      const date = new Date(reaction.message.createdTimestamp);
      const formattedDate = date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const attachmentUrl =
        reaction.message.attachments.at(0) === undefined
          ? null
          : reaction.message.attachments.at(0)?.url;

      const embedUrl =
        reaction.message.embeds.at(0)?.thumbnail === undefined
          ? null
          : reaction.message.embeds.at(0)?.thumbnail?.url;

      // log.debug(F, `attachmentUrl: ${attachmentUrl}`);

      const embed = new EmbedBuilder()
        .setAuthor({
          iconURL: reaction.message.author?.displayAvatarURL(),
          name: reaction.message.author?.username ?? '',
          url: reaction.message.url,
        })
        .setColor(Colors.Purple)
        .addFields({
          inline: true,
          name: '\u200B',
          value: `[Go to post!](${reaction.message.url})`,
        })
        .setFooter({
          text: `Sent in #${(reaction.message.channel as TextChannel).name} at ${formattedDate}`,
        });

      if (reaction.message.content && !embedUrl) {
        embed.setDescription(reaction.message.content);
      }

      if (attachmentUrl) {
        embed.setImage(attachmentUrl);
      }

      if (embedUrl) {
        embed.setImage(embedUrl);
      }

      await channelBestof.send({ embeds: [embed] });
    }
  }
}
