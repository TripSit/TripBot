import {
  ChannelType, Message, MessageType, PartialMessage, Webhook,
} from 'discord.js';
import {
  EDIT_SUFFIX, findGateways, registerBridgeTarget, relayMessage,
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

/** Matterbridge's UseLocalAvatar: borrow the avatar of a member with the same name. */
function guessAvatar(guildId: string | undefined, nick: string): string | undefined {
  const guild = guildId ? discordClient.guilds.cache.get(guildId) : undefined;
  const name = nick.toLowerCase();
  return guild?.members.cache
    .find(member => member.displayName.toLowerCase() === name || member.user.username.toLowerCase() === name)
    ?.displayAvatarURL();
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
    const avatarURL = message.avatarUrl ?? guessAvatar(webhook.guildId, message.nick);
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
