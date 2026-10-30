import { ChannelType, Collection, MessageType } from 'discord.js';
import type { Message, PartialMessage } from 'discord.js';
import type { Mock } from 'vitest';
import type { BridgeOutgoing } from '../../../global/bridge/bridge.types';

const LOUNGE_ID = 'discord-lounge';
const BOT_ID = 'bot-user';
const WEBHOOK_ID = 'webhook-1';
const WEBHOOK_NAME = 'TripSit Chat Bridge';

let chatBridge: typeof import('../../utils/chatBridge');
let core: typeof import('../../../global/bridge/bridge');
let ircSend: Mock;
let webhookSend: Mock;
let fetchWebhooks: Mock;
let createWebhook: Mock;
let channelFetch: Mock;
const originalDiscordClient = global.discordClient;
const originalLounge = env.CHANNEL_LOUNGE;

function webhook(overrides: Record<string, unknown> = {}) {
  return {
    id: WEBHOOK_ID,
    name: WEBHOOK_NAME,
    guildId: 'guild-1',
    owner: { id: BOT_ID },
    send: webhookSend,
    ...overrides,
  };
}

function message(overrides: Record<string, unknown> = {}): Message {
  return {
    id: 'message-1',
    type: MessageType.Default,
    channelId: LOUNGE_ID,
    content: 'hello',
    cleanContent: 'hello',
    webhookId: null,
    applicationId: null,
    editedTimestamp: null,
    partial: false,
    attachments: new Collection(),
    embeds: [],
    member: { displayName: 'Moony' },
    author: {
      bot: false,
      username: 'moonbear',
      displayName: 'Moonbear',
      displayAvatarURL: () => 'https://cdn/avatar.png',
    },
    client: { user: { id: BOT_ID } },
    inGuild: () => true,
    ...overrides,
  } as unknown as Message;
}

function outgoing(overrides: Partial<BridgeOutgoing> = {}): BridgeOutgoing {
  return {
    gateway: 'Lounge', sourcePlatform: 'irc', nick: 'IrcUser', text: 'hi from irc', action: false, ...overrides,
  };
}

beforeEach(async () => {
  vi.resetModules();
  env.CHANNEL_LOUNGE = LOUNGE_ID;
  chatBridge = await import('../../utils/chatBridge');
  core = await import('../../../global/bridge/bridge');
  ircSend = vi.fn().mockResolvedValue(undefined);
  core.registerBridgeTarget({ platform: 'irc', send: ircSend });

  webhookSend = vi.fn().mockResolvedValue(undefined);
  fetchWebhooks = vi.fn().mockResolvedValue(new Collection());
  createWebhook = vi.fn().mockResolvedValue(webhook());
  channelFetch = vi.fn().mockResolvedValue({ type: ChannelType.GuildText, fetchWebhooks, createWebhook });
  const members = new Collection([
    ['1', { displayName: 'IrcUser', user: { username: 'ircuser' }, displayAvatarURL: () => 'https://cdn/ircuser.png' }],
  ]);
  global.discordClient = {
    user: { id: BOT_ID },
    isReady: () => true,
    channels: { fetch: channelFetch },
    guilds: { cache: new Collection([['guild-1', { members: { cache: members } }]]) },
  } as unknown as typeof global.discordClient;
  vi.spyOn(global.log, 'error').mockReturnValue(undefined as never);
});

afterEach(() => {
  global.discordClient = originalDiscordClient;
  env.CHANNEL_LOUNGE = originalLounge;
  vi.restoreAllMocks();
});

describe('discordBridgeTarget', () => {
  it('creates a webhook once and sends as the relayed user', async () => {
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing());
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing());

    expect(createWebhook).toHaveBeenCalledTimes(1);
    expect(createWebhook).toHaveBeenCalledWith(expect.objectContaining({ name: WEBHOOK_NAME }));
    expect(webhookSend).toHaveBeenCalledWith({
      content: 'hi from irc',
      username: 'IrcUser',
      avatarURL: 'https://cdn/ircuser.png',
      allowedMentions: { parse: [] },
    });
  });

  it('drops messages until Discord is ready', async () => {
    vi.spyOn(global.log, 'debug').mockReturnValue(undefined as never);
    global.discordClient.isReady = (() => false) as typeof global.discordClient.isReady;
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing());
    expect(channelFetch).not.toHaveBeenCalled();
    expect(webhookSend).not.toHaveBeenCalled();
  });

  it('reuses an existing bridge webhook owned by the bot', async () => {
    fetchWebhooks.mockResolvedValue(new Collection([
      ['other', webhook({ id: 'other', owner: { id: 'someone-else' } })],
      [WEBHOOK_ID, webhook()],
    ]));
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing());
    expect(createWebhook).not.toHaveBeenCalled();
    expect(webhookSend).toHaveBeenCalled();
  });

  it('creates only one webhook for concurrent messages', async () => {
    await Promise.all([
      chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing()),
      chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing()),
    ]);
    expect(createWebhook).toHaveBeenCalledTimes(1);
  });

  it('retries webhook setup after a failure', async () => {
    channelFetch.mockRejectedValueOnce(new Error('Missing Access'));
    await expect(chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing())).rejects.toThrow('Missing Access');
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing());
    expect(webhookSend).toHaveBeenCalledTimes(1);
  });

  it('refuses channels that cannot hold webhooks', async () => {
    channelFetch.mockResolvedValue({ type: ChannelType.GuildVoice });
    await expect(chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing())).rejects.toThrow('cannot hold webhooks');
  });

  it('prefers the avatar from the source platform', async () => {
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing({ avatarUrl: 'https://matrix/avatar.png' }));
    expect(webhookSend).toHaveBeenCalledWith(expect.objectContaining({ avatarURL: 'https://matrix/avatar.png' }));
  });

  it('leaves the avatar unset when no member matches', async () => {
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing({ nick: 'Stranger' }));
    expect(webhookSend).toHaveBeenCalledWith(expect.objectContaining({ avatarURL: undefined }));
  });

  it('italicizes actions and cleans the username', async () => {
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing({ action: true, text: 'waves', nick: 'discordguy' }));
    expect(webhookSend).toHaveBeenCalledWith(expect.objectContaining({ content: '_waves_', username: 'guy' }));
  });

  it('splits messages longer than 2000 characters', async () => {
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing({ text: 'x'.repeat(2500) }));
    expect(webhookSend.mock.calls.map(([options]) => options.content.length)).toEqual([2000, 500]);
  });
});

describe('isBridgeWebhookMessage', () => {
  it('recognizes messages from a webhook the bridge set up', async () => {
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing());
    expect(chatBridge.isBridgeWebhookMessage(message({ webhookId: WEBHOOK_ID }))).toBe(true);
  });

  it('recognizes bridge webhook messages from before a restart', () => {
    const fromBridge = message({
      webhookId: 'old-webhook',
      applicationId: BOT_ID,
      author: { username: WEBHOOK_NAME },
    });
    expect(chatBridge.isBridgeWebhookMessage(fromBridge)).toBe(true);
  });

  it('does not match other webhooks or normal messages', () => {
    expect(chatBridge.isBridgeWebhookMessage(message({ webhookId: 'someone-elses' }))).toBe(false);
    expect(chatBridge.isBridgeWebhookMessage(message())).toBe(false);
  });
});

describe('discordMessageText', () => {
  it('uses resolved mentions and shortens custom emoji', () => {
    const text = chatBridge.discordMessageText(message({
      content: '<@1> <:blob:123> <a:dance:456>',
      cleanContent: '@Moony <:blob:123> <a:dance:456>',
    }));
    expect(text).toBe('@Moony :blob: :dance:');
  });

  it('adds attachments as links', () => {
    const attachments = new Collection([['a', { url: 'https://cdn/file.png' }]]);
    expect(chatBridge.discordMessageText(message({ attachments }))).toBe('hello\nhttps://cdn/file.png');
  });

  it('includes embeds from bots only', () => {
    const embeds = [
      { title: 'Title', description: 'Desc', url: 'https://x' },
      { title: null, description: null, url: null },
    ];
    const bot = message({
      content: '', cleanContent: '', embeds, author: { bot: true },
    });
    expect(chatBridge.discordMessageText(bot)).toBe('embed: Title - Desc - https://x');
    expect(chatBridge.discordMessageText(message({ embeds }))).toBe('hello');
  });
});

describe('relayDiscordMessage', () => {
  it('relays bridged channel messages using the server nickname', async () => {
    await chatBridge.relayDiscordMessage(message());
    expect(ircSend).toHaveBeenCalledWith('#lounge', expect.objectContaining({
      nick: 'Moony',
      text: 'hello',
      sourcePlatform: 'discord',
      avatarUrl: 'https://cdn/avatar.png',
    }));
  });

  it('falls back to the display name without a member', async () => {
    await chatBridge.relayDiscordMessage(message({ member: null }));
    expect(ircSend).toHaveBeenCalledWith('#lounge', expect.objectContaining({ nick: 'Moonbear' }));
  });

  it.each([
    ['direct messages', { inGuild: () => false }],
    ['system messages', { type: MessageType.UserJoin }],
    ['unbridged channels', { channelId: 'elsewhere' }],
    ['empty messages', { content: '', cleanContent: '' }],
    ['bridge webhook messages', { webhookId: 'w', applicationId: BOT_ID, author: { username: WEBHOOK_NAME } }],
  ])('ignores %s', async (_name, overrides) => {
    await chatBridge.relayDiscordMessage(message(overrides));
    expect(ircSend).not.toHaveBeenCalled();
  });

  it('relays other bots and slash command replies', async () => {
    await chatBridge.relayDiscordMessage(message({
      type: MessageType.ChatInputCommand,
      author: {
        bot: true, username: 'TripBot', displayName: 'TripBot', displayAvatarURL: () => '',
      },
      member: null,
    }));
    expect(ircSend).toHaveBeenCalledWith('#lounge', expect.objectContaining({ nick: 'TripBot' }));
  });

  it('logs instead of throwing when relaying fails', async () => {
    const broken = message();
    Object.defineProperty(broken, 'cleanContent', { get: () => { throw new Error('boom'); } });
    await expect(chatBridge.relayDiscordMessage(broken)).resolves.toBeUndefined();
    expect(global.log.error).toHaveBeenCalledWith('chatBridge', expect.stringContaining('boom'));
  });
});

describe('relayDiscordEdit', () => {
  const edited = (overrides: Record<string, unknown> = {}) => message({
    content: 'fixed', cleanContent: 'fixed', editedTimestamp: 2, ...overrides,
  });

  it('relays content edits with the edit suffix', async () => {
    await chatBridge.relayDiscordEdit(message({ editedTimestamp: null }), edited());
    expect(ircSend).toHaveBeenCalledWith('#lounge', expect.objectContaining({ text: 'fixed (edited)' }));
  });

  it('fetches partial messages before relaying', async () => {
    const fetch = vi.fn().mockResolvedValue(edited());
    const partial = { partial: true, editedTimestamp: 2, fetch } as unknown as PartialMessage;
    await chatBridge.relayDiscordEdit({ partial: true, editedTimestamp: null } as unknown as PartialMessage, partial);
    expect(fetch).toHaveBeenCalled();
    expect(ircSend).toHaveBeenCalledWith('#lounge', expect.objectContaining({ text: 'fixed (edited)' }));
  });

  it.each([
    ['updates that are not edits', message({ editedTimestamp: null }), message({ editedTimestamp: null })],
    ['repeat updates of the same edit', edited(), edited()],
    ['edits that keep the same content', message({ content: 'fixed', editedTimestamp: 1 }), edited()],
    ['bot edits', message({ editedTimestamp: 1 }), edited({ author: { bot: true } })],
  ])('ignores %s', async (_name, oldMessage, newMessage) => {
    await chatBridge.relayDiscordEdit(oldMessage, newMessage);
    expect(ircSend).not.toHaveBeenCalled();
  });
});
