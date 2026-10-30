import {
  ChannelType, GuildMember, Message, MessageType, PartialMessage, Webhook,
} from 'discord.js';
import {
  EDIT_SUFFIX, findGateways, registerBridgeTarget, relayDeletion, relayMessage,
} from '../../global/bridge/bridge';
import { chunkText, toDiscordUsername } from '../../global/bridge/bridge.format';
import { BridgeOutgoing, BridgeTarget } from '../../global/bridge/bridge.types';

const F = f(__filename);

// Separate from the guild-to-guild bridge webhook ('Tripsit Bridge') so the two don't pick up each other's messages
export const CHAT_BRIDGE_WEBHOOK_NAME = 'TripSit Chat Bridge';
const DISCORD_MESSAGE_LIMIT = 2000;
const RELAYED_MESSAGE_TYPES = new Set([
  MessageType.Default,
  MessageType.Reply,
  MessageType.ChatInputCommand,
  MessageType.ContextMenuCommand,
]);

const webhooks = new Map<string, Promise<Webhook>>();
const bridgeWebhookIds = new Set<string>();

async function createOrFindWebhook(channelId: string): Promise<Webhook> {
  const channel = await discordClient.channels.fetch(channelId);
  if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)) {
    throw new Error(`Channel ${channelId} cannot hold webhooks`);
  }
  const existing = (await channel.fetchWebhooks())
    .find(webhook => webhook.name === CHAT_BRIDGE_WEBHOOK_NAME && webhook.owner?.id === discordClient.user?.id);
  const webhook = existing ?? await channel.createWebhook({
    name: CHAT_BRIDGE_WEBHOOK_NAME,
    reason: 'Relays IRC and Matrix messages',
  });
  bridgeWebhookIds.add(webhook.id);
  return webhook;
}

function getWebhook(channelId: string): Promise<Webhook> {
  let webhook = webhooks.get(channelId);
  if (!webhook) {
    // Cache the promise so concurrent messages don't create duplicate webhooks
    webhook = createOrFindWebhook(channelId);
    webhooks.set(channelId, webhook);
    webhook.catch(() => webhooks.delete(channelId));
  }
  return webhook;
}

const AVATAR_CACHE_MS = 10 * 60_000;
const MAX_AVATAR_CACHE = 500;
const avatarCache = new Map<string, { url: string | undefined; expires: number }>();

function matchesName(member: GuildMember, name: string): boolean {
  return member.displayName.toLowerCase() === name || member.user.username.toLowerCase() === name;
}

/**
 * Matterbridge's UseLocalAvatar: borrow the avatar of a member with the same name.
 * The member cache only holds members the bot has seen, so fall back to a member search.
 */
async function guessAvatar(guildId: string | undefined, nick: string): Promise<string | undefined> {
  const guild = guildId ? discordClient.guilds.cache.get(guildId) : undefined;
  if (!guild) return undefined;
  const name = nick.toLowerCase();
  const key = `${guild.id}:${name}`;
  const cached = avatarCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.url;

  let member = guild.members.cache.find(candidate => matchesName(candidate, name));
  if (!member) {
    try {
      const results = await guild.members.search({ query: name.slice(0, 100), limit: 10 });
      member = results.find(candidate => matchesName(candidate, name));
    } catch (err) {
      // Not worth failing the relay over; the webhook falls back to its default avatar
      log.debug(F, `Avatar lookup failed for a relayed user: ${err}`);
      return undefined;
    }
  }

  const url = member?.displayAvatarURL();
  if (avatarCache.size >= MAX_AVATAR_CACHE) avatarCache.delete(avatarCache.keys().next().value as string);
  avatarCache.set(key, { url, expires: Date.now() + AVATAR_CACHE_MS });
  return url;
}

export const discordBridgeTarget: BridgeTarget = {
  platform: 'discord',
  async send(channelId: string, message: BridgeOutgoing): Promise<void> {
    if (!discordClient?.isReady()) {
      log.debug(F, `Discord is not ready, dropping message for ${channelId}`);
      return;
    }
    const webhook = await getWebhook(channelId);
    const content = message.action ? `_${message.text}_` : message.text;
    const username = toDiscordUsername(message.nick);
    const avatarURL = message.avatarUrl ?? await guessAvatar(webhook.guildId, message.nick);
    // eslint-disable-next-line no-restricted-syntax
    for (const chunk of chunkText(content, DISCORD_MESSAGE_LIMIT)) {
      await webhook.send({ // eslint-disable-line no-await-in-loop
        content: chunk,
        username,
        avatarURL,
        // IRC users can type raw <@id> text, so never let relayed content ping anyone
        allowedMentions: { parse: [] },
      });
    }
  },
};

export function registerDiscordBridge(): void {
  registerBridgeTarget(discordBridgeTarget);
}

export function isBridgeWebhookMessage(message: Message): boolean {
  if (!message.webhookId) return false;
  return bridgeWebhookIds.has(message.webhookId)
    || (message.author.username === CHAT_BRIDGE_WEBHOOK_NAME && message.applicationId === message.client.user.id);
}

/** Text as IRC/Matrix users should see it: mentions resolved, custom emoji shortened, attachments as links. */
export function discordMessageText(message: Message): string {
  const parts: string[] = [];
  if (message.content) parts.push(message.cleanContent.replace(/<a?(:\w+:)\d+>/g, '$1'));
  message.attachments.forEach(attachment => parts.push(attachment.url));
  // Matterbridge's ShowEmbeds; limited to bots so user link previews don't duplicate the link
  if (message.author.bot) {
    message.embeds
      .filter(embed => embed.title || embed.description || embed.url)
      .forEach(embed => parts.push(`embed: ${embed.title ?? ''} - ${embed.description ?? ''} - ${embed.url ?? ''}`));
  }
  return parts.join('\n');
}

async function relay(message: Message, suffix: string): Promise<void> {
  if (!message.inGuild()) return;
  if (!RELAYED_MESSAGE_TYPES.has(message.type)) return;
  if (isBridgeWebhookMessage(message)) return;
  if (findGateways('discord', message.channelId).length === 0) return;

  const text = discordMessageText(message);
  if (!text) return;

  await relayMessage({
    platform: 'discord',
    channel: message.channelId,
    // Server nickname rather than username, like Matterbridge's UseUserName = false
    nick: message.member?.displayName ?? message.author.displayName,
    text: `${text}${suffix}`,
    avatarUrl: message.author.displayAvatarURL(),
    id: message.id,
  });
}

export async function relayDiscordMessage(message: Message): Promise<void> {
  try {
    await relay(message, '');
  } catch (err) {
    log.error(F, `Failed to relay Discord message ${message.id}: ${err}`);
  }
}

export async function relayDiscordEdit(
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage,
): Promise<void> {
  try {
    // Link previews and bot component updates also fire messageUpdate; only relay real content edits
    if (!newMessage.editedTimestamp || oldMessage.editedTimestamp === newMessage.editedTimestamp) return;
    if (!oldMessage.partial && oldMessage.content === newMessage.content) return;
    const message = newMessage.partial ? await newMessage.fetch() : newMessage;
    if (message.author.bot) return;
    await relay(message, EDIT_SUFFIX);
  } catch (err) {
    log.error(F, `Failed to relay Discord edit ${newMessage.id}: ${err}`);
  }
}

export async function relayDiscordDelete(message: Message | PartialMessage): Promise<void> {
  try {
    // Partial deletes still carry the IDs, which is all the target needs
    if (!message.guildId || findGateways('discord', message.channelId).length === 0) return;
    if (isBridgeWebhookMessage(message as Message)) return;
    await relayDeletion({ platform: 'discord', channel: message.channelId, id: message.id });
  } catch (err) {
    log.error(F, `Failed to relay Discord delete ${message.id}: ${err}`);
  }
}
