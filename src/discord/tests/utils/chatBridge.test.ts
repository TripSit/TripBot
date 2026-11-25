import {
  ChannelType, Collection, MessageType, PermissionFlagsBits, PermissionsBitField,
} from 'discord.js';
import type { Message, PartialMessage } from 'discord.js';
import type { Mock } from 'vitest';
import type { BridgeOutgoing } from '../../../global/bridge/bridge.types';
import { bridgeRows, LOUNGE_ID } from '../../../vitest/utils/bridgeMappings';
import { dbMock } from '../../../vitest/utils/mockDb';

const BOT_ID = 'bot-user';
const WEBHOOK_ID = 'webhook-1';
const WEBHOOK_NAME = 'TripSit Chat Bridge';

let chatBridge: typeof import('../../utils/chatBridge');
let core: typeof import('../../../global/bridge/bridge');
let mappings: typeof import('../../../global/bridge/bridge.mappings');
let ircSend: Mock;
let webhookSend: Mock;
let fetchWebhooks: Mock;
let createWebhook: Mock;
let channelFetch: Mock;
let memberSearch: Mock;
let memberFetch: Mock;
let relayMembers: Collection<string, { roles: { cache: Collection<string, object> } }>;
const originalDiscordClient = global.discordClient;

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
    guild: { members: { cache: relayMembers, fetch: memberFetch } },
    author: {
      id: 'author-1',
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
  chatBridge = await import('../../utils/chatBridge');
  core = await import('../../../global/bridge/bridge');
  mappings = await import('../../../global/bridge/bridge.mappings');
  mappings.setMappings(bridgeRows());
  ircSend = vi.fn().mockResolvedValue(undefined);
  core.registerBridgeTarget({ platform: 'irc', send: ircSend });

  webhookSend = vi.fn().mockResolvedValue(undefined);
  fetchWebhooks = vi.fn().mockResolvedValue(new Collection());
  createWebhook = vi.fn().mockResolvedValue(webhook());
  channelFetch = vi.fn().mockResolvedValue({ type: ChannelType.GuildText, fetchWebhooks, createWebhook });
  memberSearch = vi.fn().mockResolvedValue(new Collection());
  relayMembers = new Collection([['author-1', { roles: { cache: new Collection([[env.ROLE_IRC_BRIDGE, {}]]) } }]]);
  memberFetch = vi.fn().mockImplementation(async (id: string) => relayMembers.get(id));
  const members = new Collection([
    ['1', { displayName: 'IrcUser', user: { username: 'ircuser' }, displayAvatarURL: () => 'https://cdn/ircuser.png' }],
  ]);
  global.discordClient = {
    user: { id: BOT_ID },
    isReady: () => true,
    channels: { fetch: channelFetch },
    guilds: { cache: new Collection([['guild-1', { id: 'guild-1', members: { cache: members, search: memberSearch } }]]) },
  } as unknown as typeof global.discordClient;
  vi.spyOn(global.log, 'error').mockReturnValue(undefined as never);
});

afterEach(() => {
  global.discordClient = originalDiscordClient;
  mappings.setMappings([]);
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
    expect(channelFetch).toHaveBeenCalledTimes(0);
    expect(webhookSend).toHaveBeenCalledTimes(0);
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
    expect(webhookSend).toHaveBeenCalledTimes(0);
  });

  it('prefers the avatar from the source platform', async () => {
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing({ avatarUrl: 'https://matrix/avatar.png' }));
    expect(webhookSend).toHaveBeenCalledWith(expect.objectContaining({ avatarURL: 'https://matrix/avatar.png' }));
  });

  it('leaves the avatar unset when no member matches', async () => {
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing({ nick: 'Stranger' }));
    expect(webhookSend).toHaveBeenCalledWith(expect.objectContaining({ avatarURL: undefined }));
  });

  it('searches Discord for members missing from the cache, and remembers the result', async () => {
    const found = { displayName: 'Far', user: { username: 'far' }, displayAvatarURL: () => 'https://cdn/far.png' };
    memberSearch.mockResolvedValue(new Collection([['2', found]]));

    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing({ nick: 'Far' }));
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing({ nick: 'Far' }));

    expect(memberSearch).toHaveBeenCalledTimes(1);
    expect(memberSearch).toHaveBeenCalledWith({ query: 'far', limit: 10 });
    expect(webhookSend).toHaveBeenLastCalledWith(expect.objectContaining({ avatarURL: 'https://cdn/far.png' }));
  });

  it('ignores search results that are not an exact name match', async () => {
    const close = { displayName: 'Farther', user: { username: 'farther' }, displayAvatarURL: () => 'https://cdn/x.png' };
    memberSearch.mockResolvedValue(new Collection([['2', close]]));
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing({ nick: 'Far' }));
    expect(webhookSend).toHaveBeenCalledWith(expect.objectContaining({ avatarURL: undefined }));
  });

  it('still relays when the member search fails', async () => {
    vi.spyOn(global.log, 'debug').mockReturnValue(undefined as never);
    memberSearch.mockRejectedValue(new Error('rate limited'));
    await chatBridge.discordBridgeTarget.send(LOUNGE_ID, outgoing({ nick: 'Far' }));
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

  it.each([ChannelType.GuildText, ChannelType.GuildAnnouncement])(
    'checks current visibility for automatic channel type %s before relaying',
    async type => {
      mappings.setMappings(bridgeRows().map(row => ({ ...row, source: 'auto' })));
      const permissions = new PermissionsBitField(PermissionFlagsBits.ViewChannel);
      const everyone = { id: 'everyone' };
      const permissionsFor = vi.fn(() => permissions);
      const current = message({ channel: { type, guild: { roles: { everyone } }, permissionsFor } });
      await chatBridge.relayDiscordMessage(current);
      expect(ircSend).toHaveBeenCalledTimes(1);
      expect(permissionsFor).toHaveBeenCalledWith(everyone);

      permissions.remove(PermissionFlagsBits.ViewChannel);
      await chatBridge.relayDiscordMessage(current);
      expect(ircSend).toHaveBeenCalledTimes(1);

      await chatBridge.relayDiscordEdit(current, message({
        channel: current.channel, content: 'updated', cleanContent: 'updated', editedTimestamp: 1,
      }));
      expect(ircSend).toHaveBeenCalledTimes(1);
    },
  );

  it('checks visibility after the asynchronous member lookup', async () => {
    mappings.setMappings(bridgeRows().map(row => ({ ...row, source: 'auto' })));
    const permissions = new PermissionsBitField(PermissionFlagsBits.ViewChannel);
    memberFetch.mockImplementationOnce(async () => {
      permissions.remove(PermissionFlagsBits.ViewChannel);
      return relayMembers.get('author-1');
    });
    await chatBridge.relayDiscordMessage(message({
      channel: {
        type: ChannelType.GuildText,
        guild: { roles: { everyone: { id: 'everyone' } } },
        permissionsFor: () => permissions,
      },
    }));
    expect(ircSend.mock.calls).toHaveLength(0);
  });

  it('fails closed when an automatic mapping no longer has a supported channel type', async () => {
    mappings.setMappings(bridgeRows().map(row => ({ ...row, source: 'auto' })));
    await chatBridge.relayDiscordMessage(message({ channel: { type: ChannelType.PublicThread } }));
    expect(ircSend.mock.calls).toHaveLength(0);
  });

  it('keeps explicit override mappings eligible for private channels', async () => {
    await chatBridge.relayDiscordMessage(message({
      channel: {
        type: ChannelType.GuildText,
        guild: { roles: { everyone: { id: 'everyone' } } },
        permissionsFor: () => new PermissionsBitField(),
      },
    }));
    expect(ircSend).toHaveBeenCalledTimes(1);
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

  it('does not relay users without the IRC Bridge role', async () => {
    relayMembers.get('author-1')?.roles.cache.clear();
    await chatBridge.relayDiscordMessage(message());
    expect(ircSend).not.toHaveBeenCalled();
  });

  it('uses the role alone without a database consent lookup', async () => {
    await chatBridge.relayDiscordMessage(message());
    expect(ircSend).toHaveBeenCalledTimes(1);
    expect(dbMock.users.findUnique).not.toHaveBeenCalled();
  });

  it('fails closed when the member lookup fails', async () => {
    memberFetch.mockRejectedValueOnce(new Error('member unavailable'));
    await chatBridge.relayDiscordMessage(message());
    expect(ircSend).not.toHaveBeenCalled();
    expect(global.log.error).toHaveBeenCalledWith('chatBridge', expect.stringContaining('member unavailable'));
  });

  it('fails closed when the member is missing', async () => {
    relayMembers.clear();
    await chatBridge.relayDiscordMessage(message());
    expect(ircSend).not.toHaveBeenCalled();
  });

  it('never relays webhook content even when its author has the role', async () => {
    await chatBridge.relayDiscordMessage(message({ webhookId: 'other-webhook' }));
    expect(ircSend).not.toHaveBeenCalled();
    expect(memberFetch).not.toHaveBeenCalled();
  });

  it('rechecks the current member role for queued delivery', async () => {
    await chatBridge.relayDiscordMessage(message());
    const sent = ircSend.mock.calls[0][1] as BridgeOutgoing;
    expect(sent.canSend?.()).toBe(true);
    relayMembers.set('author-1', { roles: { cache: new Collection() } });
    expect(sent.canSend?.()).toBe(false);
  });

  it('blocks queued delivery while Discord cannot provide current member updates', async () => {
    await chatBridge.relayDiscordMessage(message());
    const sent = ircSend.mock.calls[0][1] as BridgeOutgoing;
    global.discordClient.isReady = (() => false) as typeof global.discordClient.isReady;
    expect(sent.canSend?.()).toBe(false);
  });

  it('relays bot replies only when the bot has the bridge role', async () => {
    await chatBridge.relayDiscordMessage(message({
      type: MessageType.ChatInputCommand,
      author: {
        id: 'author-1', bot: true, username: 'TripBot', displayName: 'TripBot', displayAvatarURL: () => '',
      },
      member: null,
    }));
    expect(ircSend).toHaveBeenCalledWith('#lounge', expect.objectContaining({ nick: 'TripBot' }));
    relayMembers.get('author-1')?.roles.cache.clear();
    await chatBridge.relayDiscordMessage(message({ author: { ...message().author, bot: true } }));
    expect(ircSend).toHaveBeenCalledTimes(1);
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

  it('does not relay edits after consent is withdrawn', async () => {
    relayMembers.get('author-1')?.roles.cache.clear();
    await chatBridge.relayDiscordEdit(message(), edited());
    expect(ircSend).not.toHaveBeenCalled();
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

describe('relayDiscordDelete', () => {
  let remove: Mock;

  beforeEach(() => {
    remove = vi.fn().mockResolvedValue(undefined);
    core.registerBridgeTarget({ platform: 'irc', send: ircSend, remove });
  });

  it('relays the delete by message ID', async () => {
    relayMembers.get('author-1')?.roles.cache.clear();
    await chatBridge.relayDiscordDelete(message({ guildId: 'guild-1' }));
    expect(remove).toHaveBeenCalledWith('#lounge', 'message-1');
  });

  it('works for partial messages that only carry IDs', async () => {
    const partial = {
      id: 'message-2', channelId: LOUNGE_ID, guildId: 'guild-1', partial: true,
    };
    await chatBridge.relayDiscordDelete(partial as unknown as PartialMessage);
    expect(remove).toHaveBeenCalledWith('#lounge', 'message-2');
  });

  it.each([
    ['unbridged channels', { channelId: 'elsewhere' }],
    ['direct messages', { guildId: null }],
  ])('skips %s', async (_name, overrides) => {
    await chatBridge.relayDiscordDelete(message({ guildId: 'guild-1', ...overrides }));
    expect(remove).not.toHaveBeenCalled();
  });
});
