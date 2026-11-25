// Pagination and dependent deletions must finish in order so failures leave cleanup retryable.
/* eslint-disable no-await-in-loop */
import { DiscordAPIError, RESTJSONErrorCodes, TextChannel } from 'discord.js';
import type { Channel, Message } from 'discord.js';

const DELETION_REASON = 'User requested deletion of their TripBot data';

const MISSING_CHANNEL_CODES: number[] = [RESTJSONErrorCodes.UnknownChannel, RESTJSONErrorCodes.UnknownGuild];

function isDiscordError(error: unknown, codes: number[]): boolean {
  return error instanceof DiscordAPIError && codes.includes(Number(error.code));
}

function messageMentionsUser(message: Message, discordId: string): boolean {
  return message.content.includes(discordId) || JSON.stringify(message.embeds ?? []).includes(discordId);
}

/** Pages through a channel, newest first, calling `visit` per message until it returns true or history ends. */
async function forEachMessagePage(
  channel: TextChannel,
  visit: (message: Message) => Promise<boolean | void>,
): Promise<void> {
  let before: string | undefined;
  while (true) {
    const messages = await channel.messages.fetch(before ? { limit: 100, before } : { limit: 100 });
    if (messages.size === 0) return;

    for (const message of messages.values()) { // eslint-disable-line no-restricted-syntax
      if (await visit(message)) return; // eslint-disable-line no-await-in-loop
    }

    const oldestMessage = [...messages.values()].at(-1);
    if (!oldestMessage || messages.size < 100) return;
    before = oldestMessage.id;
  }
}

async function fetchLogChannel(channelId: string): Promise<TextChannel | null> {
  let channel: Channel | null;
  try {
    channel = await discordClient.channels.fetch(channelId);
  } catch (error) {
    if (isDiscordError(error, MISSING_CHANNEL_CODES)) return null;
    throw error;
  }
  if (!channel) return null;
  if (!channel.isTextBased() || !('messages' in channel)) {
    throw new Error(`Log channel ${channelId} is not available for privacy cleanup`);
  }
  return channel as TextChannel;
}

/** Deletes every message in a log channel that `matches`. A channel that no longer exists is skipped. */
export async function deleteChannelMessages(channelId: string, matches: (message: Message) => boolean): Promise<void> {
  const channel = await fetchLogChannel(channelId);
  if (!channel) return;
  await forEachMessagePage(channel, async message => {
    if (matches(message)) await message.delete();
  });
}

async function deleteLogMessages(channelId: string, discordId: string): Promise<void> {
  await deleteChannelMessages(channelId, message => messageMentionsUser(message, discordId));
}

/** Deletes the Best Of channel copies of the given source messages. */
export async function deleteBestOfMessages(bestOfMessageIds: string[]): Promise<void> {
  const remainingBestOfIds = new Set(bestOfMessageIds);
  if (remainingBestOfIds.size === 0) return;

  const bestOfChannel = await discordClient.channels.fetch(env.CHANNEL_BESTOF);
  if (!bestOfChannel?.isTextBased() || !('messages' in bestOfChannel)) {
    throw new Error('Best Of channel is not available for privacy cleanup');
  }

  await forEachMessagePage(bestOfChannel as TextChannel, async message => {
    const sourceMessageId = message.embeds
      .map(embed => embed.author?.url?.split('/').at(-1))
      .find(id => id && remainingBestOfIds.has(id));
    if (sourceMessageId) {
      await message.delete();
      remainingBestOfIds.delete(sourceMessageId);
    }
    return remainingBestOfIds.size === 0;
  });
}

async function deleteThreads(channelIds: string[]): Promise<void> {
  for (const channelId of channelIds) { // eslint-disable-line no-restricted-syntax
    try {
      const channel = await discordClient.channels.fetch(channelId);
      if (!channel) continue; // eslint-disable-line no-continue
      if (!channel.isThread()) throw new Error(`Privacy cleanup target ${channelId} is not a thread`);
      await channel.delete(DELETION_REASON);
    } catch (error) {
      if (isDiscordError(error, [RESTJSONErrorCodes.UnknownChannel])) continue; // eslint-disable-line no-continue
      throw error;
    }
  }
}

async function revokeIrcBridgeRole(discordId: string): Promise<void> {
  try {
    const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
    const member = await guild.members.fetch(discordId);
    if (member.roles.cache.has(env.ROLE_IRC_BRIDGE)) {
      await member.roles.remove(env.ROLE_IRC_BRIDGE, DELETION_REASON);
    }
  } catch (error) {
    if (isDiscordError(error, [RESTJSONErrorCodes.UnknownMember, RESTJSONErrorCodes.UnknownGuild])) return;
    throw error;
  }
}

/** Deletes bot-managed user data from Discord and revokes IRC bridge consent during data deletion. */
export async function deleteDiscordPrivacyData(
  discordId: string,
  channelIds: string[],
  bestOfMessageIds: string[],
  moderationLogChannelIds: string[] = [],
): Promise<void> {
  const logChannelIds = new Set([
    env.CHANNEL_BOTERRORS, env.CHANNEL_BOTLOG, env.CHANNEL_MODLOG, env.CHANNEL_QUOTE_LOG, ...moderationLogChannelIds,
  ]);
  for (const channelId of logChannelIds) { // eslint-disable-line no-restricted-syntax
    await deleteLogMessages(channelId, discordId); // eslint-disable-line no-await-in-loop
  }
  await deleteBestOfMessages(bestOfMessageIds);
  await deleteThreads(channelIds);
  await revokeIrcBridgeRole(discordId);
}

export default deleteDiscordPrivacyData;
