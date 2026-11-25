// Pagination and dependent deletions must finish in order so failures leave cleanup retryable.
/* eslint-disable no-await-in-loop */
import { DiscordAPIError, RESTJSONErrorCodes, TextChannel } from 'discord.js';
import type { Channel } from 'discord.js';

const DELETION_REASON = 'User requested deletion of their TripBot data';

async function deleteLogMessages(channelId: string, discordId: string): Promise<void> {
  let channel: Channel | null;
  try {
    channel = await discordClient.channels.fetch(channelId);
  } catch (error) {
    if (error instanceof DiscordAPIError
      && (error.code === RESTJSONErrorCodes.UnknownChannel || error.code === RESTJSONErrorCodes.UnknownGuild)) return;
    throw error;
  }
  if (!channel) return;
  if (!channel.isTextBased() || !('messages' in channel)) {
    throw new Error(`Log channel ${channelId} is not available for privacy cleanup`);
  }
  const textChannel = channel as TextChannel;
  let before: string | undefined;
  while (true) {
    const options = before ? { limit: 100, before } : { limit: 100 };
    const messages = await textChannel.messages.fetch(options);
    if (messages.size === 0) break;

    for (const message of messages.values()) { // eslint-disable-line no-restricted-syntax
      if (message.content.includes(discordId) || JSON.stringify(message.embeds ?? []).includes(discordId)) {
        await message.delete(); // eslint-disable-line no-await-in-loop
      }
    }

    const oldestMessage = [...messages.values()].at(-1);
    if (!oldestMessage || messages.size < 100) break;
    before = oldestMessage.id;
  }
}

/** Deletes bot-managed user data from Discord and revokes IRC bridge consent during data deletion. */
export async function deleteDiscordPrivacyData(
  discordId: string,
  channelIds: string[],
  bestOfMessageIds: string[],
  moderationLogChannelIds: string[] = [],
): Promise<void> {
  const logChannelIds = new Set([env.CHANNEL_BOTERRORS, env.CHANNEL_BOTLOG, env.CHANNEL_MODLOG, ...moderationLogChannelIds]);
  for (const channelId of logChannelIds) { // eslint-disable-line no-restricted-syntax
    await deleteLogMessages(channelId, discordId); // eslint-disable-line no-await-in-loop
  }

  const remainingBestOfIds = new Set(bestOfMessageIds);
  if (remainingBestOfIds.size > 0) {
    const bestOfChannel = await discordClient.channels.fetch(env.CHANNEL_BESTOF);
    if (!bestOfChannel?.isTextBased() || !('messages' in bestOfChannel)) {
      throw new Error('Best Of channel is not available for privacy cleanup');
    }
    const bestOfTextChannel = bestOfChannel as TextChannel;

    let before: string | undefined;
    while (remainingBestOfIds.size > 0) {
      const options = before ? { limit: 100, before } : { limit: 100 };
      const messages = await bestOfTextChannel.messages.fetch(options);
      if (messages.size === 0) break;

      for (const message of messages.values()) { // eslint-disable-line no-restricted-syntax
        const sourceMessageId = message.embeds
          .map(embed => embed.author?.url?.split('/').at(-1))
          .find(id => id && remainingBestOfIds.has(id));
        if (!sourceMessageId) continue; // eslint-disable-line no-continue
        await message.delete(); // eslint-disable-line no-await-in-loop
        remainingBestOfIds.delete(sourceMessageId);
      }

      const oldestMessage = [...messages.values()].at(-1);
      if (!oldestMessage || messages.size < 100) break;
      before = oldestMessage.id;
    }
  }

  for (const channelId of channelIds) { // eslint-disable-line no-restricted-syntax
    try {
      const channel = await discordClient.channels.fetch(channelId);
      if (!channel) continue; // eslint-disable-line no-continue
      if (!channel.isThread()) throw new Error(`Privacy cleanup target ${channelId} is not a thread`);
      await channel.delete(DELETION_REASON);
    } catch (error) {
      if (error instanceof DiscordAPIError && error.code === RESTJSONErrorCodes.UnknownChannel) continue; // eslint-disable-line no-continue
      throw error;
    }
  }

  try {
    const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
    const member = await guild.members.fetch(discordId);
    if (member.roles.cache.has(env.ROLE_IRC_BRIDGE)) {
      await member.roles.remove(env.ROLE_IRC_BRIDGE, DELETION_REASON);
    }
  } catch (error) {
    if (error instanceof DiscordAPIError
      && (error.code === RESTJSONErrorCodes.UnknownMember || error.code === RESTJSONErrorCodes.UnknownGuild)) return;
    throw error;
  }
}

export default deleteDiscordPrivacyData;
