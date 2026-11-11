import type { ButtonInteraction, Message, MessageReaction } from 'discord.js';
import { bestOf } from '../../utils/bestOfTripsit';
import { verifyButton } from '../../utils/verifyButton';
import { dbMock } from '../../../vitest/utils/mockDb';
import { collectionOf } from '../../../vitest/utils/discordStubs';

const e = env as unknown as Record<string, string>;
const mocks = vi.hoisted(() => ({ guildOnly: vi.fn() }));
vi.mock('../../utils/guildOnly', () => ({ replyGuildOnly: mocks.guildOnly, default: mocks.guildOnly }));

describe('bestOf for orphaned threads', () => {
  it('does nothing when a thread has lost its parent channel', async () => {
    dbMock.best_of.findUnique.mockResolvedValue(null);
    const reaction = {
      count: 5, emoji: { name: 'upvote' }, partial: false, fetch: vi.fn(),
      message: { partial: false, fetch: vi.fn(), channel: { isThread: () => true, parent: null }, author: { id: 'a1' } },
    } as unknown as MessageReaction;
    await expect(bestOf(reaction)).resolves.toBeUndefined();
    expect(dbMock.best_of.create).not.toHaveBeenCalled();
  });
});

describe('bestOf', () => {
  function setup(over: { count?: number; emoji?: string; thread?: boolean; parentId?: string; channelId?: string; author?: boolean; partial?: boolean; bestOfChannel?: unknown; content?: string | null; attachment?: boolean; embedThumb?: boolean } = {}) {
    const send = vi.fn();
    const reply = vi.fn();
    const channel = {
      id: over.channelId ?? 'c1',
      parentId: over.parentId ?? 'cat',
      name: 'general',
      isThread: () => false,
      guild: { channels: { fetch: vi.fn(async () => ('bestOfChannel' in over ? over.bestOfChannel : { send, toString: (): string => '#best-of' })) } },
    };
    const messageFetch = vi.fn();
    const reaction = {
      count: over.count ?? 1,
      emoji: { name: over.emoji ?? 'upvote' },
      partial: over.partial ?? false,
      fetch: vi.fn(),
      message: {
        partial: over.partial ?? false,
        fetch: messageFetch,
        id: 'm1',
        url: 'https://discord/m1',
        createdTimestamp: Date.UTC(2024, 0, 15, 12),
        content: over.content === undefined ? 'great post' : over.content,
        channel: over.thread
          ? { isThread: () => true, parent: channel, name: 'thread' }
          : channel,
        author: over.author === false ? null : { id: 'a1', username: 'alice', displayAvatarURL: () => 'https://av' },
        reply,
        attachments: { at: () => (over.attachment ? { url: 'https://attach' } : undefined) },
        embeds: { at: () => (over.embedThumb ? { thumbnail: { url: 'https://thumb' } } : undefined) },
      },
    };
    return {
      reaction: reaction as unknown as MessageReaction, send, reply, channel, messageFetch,
    };
  }

  it('records and announces messages that reach the threshold', async () => {
    dbMock.best_of.findUnique.mockResolvedValue(null);
    const { reaction, send, reply } = setup();
    await bestOf(reaction);
    expect(dbMock.best_of.create).toHaveBeenCalledWith({ data: expect.objectContaining({ message_id: 'm1', user_id: 'a1' }) });
    expect(reply).toHaveBeenCalledWith(expect.stringContaining('#best-of'));
    const embed = send.mock.calls[0][0].embeds[0].data;
    expect(embed.description).toBe('great post');
    expect(embed.footer.text).toContain('January 15, 2024');
  });

  it('uses attachment and embed images, preferring the embed thumbnail over text', async () => {
    dbMock.best_of.findUnique.mockResolvedValue(null);
    const withAttachment = setup({ attachment: true, content: null });
    await bestOf(withAttachment.reaction);
    expect(withAttachment.send.mock.calls[0][0].embeds[0].data.image.url).toBe('https://attach');
    const withThumb = setup({ embedThumb: true });
    await bestOf(withThumb.reaction);
    const { data } = withThumb.send.mock.calls[0][0].embeds[0];
    expect(data.image.url).toBe('https://thumb');
    expect(data.description).toBeUndefined();
  });

  it('works for threads and fetches partials', async () => {
    dbMock.best_of.findUnique.mockResolvedValue(null);
    const { reaction, messageFetch, send } = setup({ thread: true, partial: true });
    await bestOf(reaction);
    expect(messageFetch).toHaveBeenCalled();
    expect(send).toHaveBeenCalled();
  });

  it.each([
    ['too few votes', { count: 2 }],
    ['wrong emoji', { emoji: 'downvote' }],
    ['ignored category', { parentId: e.CATEGORY_TEAMTRIPSIT }],
    ['helper lounge', { channelId: undefined }],
    ['no author', { author: false }],
  ])('ignores %s', async (label, over) => {
    dbMock.best_of.findUnique.mockResolvedValue(null);
    const s = setup(label === 'helper lounge' ? { channelId: e.CHANNEL_HELPERLOUNGE } : over);
    await bestOf(s.reaction);
    expect(dbMock.best_of.create).not.toHaveBeenCalled();
  });

  it('ignores messages already in the best-of table', async () => {
    dbMock.best_of.findUnique.mockResolvedValue({ id: 'x' } as never);
    const { reaction } = setup();
    await bestOf(reaction);
    expect(dbMock.best_of.create).not.toHaveBeenCalled();
  });

  it('records the entry but does not post when the best-of channel is missing', async () => {
    dbMock.best_of.findUnique.mockResolvedValue(null);
    const { reaction, reply } = setup({ bestOfChannel: undefined });
    await bestOf(reaction);
    expect(dbMock.best_of.create).toHaveBeenCalled();
    expect(reply).not.toHaveBeenCalled();
  });
});

describe('verifyButton', () => {
  const NOW = new Date('2024-06-15T12:00:00Z').getTime();
  const DAY = 86_400_000;

  afterEach(() => vi.useRealTimers());

  function setup(opts: { guild?: boolean; role?: boolean; hasRole?: boolean; ageMs?: number } = {}) {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    const logSend = vi.fn();
    const loungeSend = vi.fn();
    (global as unknown as { discordClient: unknown }).discordClient = { channels: { fetch: vi.fn(async () => ({ send: logSend })) } };
    const member = {
      toString: (): string => '<@m>',
      roles: { add: vi.fn(), cache: new Set(opts.hasRole ? ['role'] : []) },
      user: { createdAt: new Date(NOW - (opts.ageMs ?? 2 * 365 * DAY)), displayAvatarURL: () => 'https://av' },
      client: { channels: { fetch: vi.fn(async () => ({ send: loungeSend })) } },
    };
    const interaction = {
      deferReply: vi.fn(),
      editReply: vi.fn(),
      user: { id: 'u', username: 'alice', discriminator: '0' },
      client: { channels: { fetch: vi.fn(async () => ({ toString: (): string => '#chan' })) } },
      guild: opts.guild === false ? null : {
        members: { fetch: vi.fn(async () => member) },
        roles: { fetch: vi.fn(async () => (opts.role === false ? null : { id: 'role' })) },
      },
    };
    return {
      interaction: interaction as unknown as ButtonInteraction, member, logSend, loungeSend, raw: interaction,
    };
  }

  it('sends people outside guilds away', async () => {
    const { interaction } = setup({ guild: false });
    await verifyButton(interaction);
    expect(mocks.guildOnly).toHaveBeenCalledWith(interaction);
  });

  it('gives the verified role, welcomes the member and replies', async () => {
    const {
      interaction, member, loungeSend, logSend, raw,
    } = setup();
    await verifyButton(interaction);
    expect(member.roles.add).toHaveBeenCalled();
    expect(logSend).toHaveBeenCalled();
    expect(raw.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('Awesome!') });
    expect(loungeSend.mock.calls[0][0].embeds[0].data.description).toContain('Please welcome <@m>');
  });

  it('does not welcome members who were already verified', async () => {
    const { interaction, loungeSend } = setup({ hasRole: true });
    await verifyButton(interaction);
    expect(loungeSend).not.toHaveBeenCalled();
  });

  it('tells the user when the role is missing', async () => {
    const { interaction, raw } = setup({ role: false });
    await verifyButton(interaction);
    expect(raw.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('Something went wrong') });
  });

  it.each([
    [2 * 365 * DAY, 0xFFFFFF], [90 * DAY, 0x9B59B6], [14 * DAY, 0x3498DB], [3 * DAY, 0x57F287],
  ])('colours the welcome by account age (%d ms)', async (age, color) => {
    const { interaction, loungeSend } = setup({ ageMs: age });
    await verifyButton(interaction);
    expect(loungeSend.mock.calls[0][0].embeds[0].data.color).toBe(color);
  });

  it.each([5 * 3_600_000, 10 * 60_000, 20_000])('handles very new accounts (%d ms)', async age => {
    const { interaction, loungeSend } = setup({ ageMs: age });
    await verifyButton(interaction);
    expect(loungeSend).toHaveBeenCalled();
  });
});

describe('bridge', () => {
  const baseMessage = (over: Record<string, unknown> = {}) => ({
    guild: { id: 'g', name: 'Other' },
    guildId: 'other',
    webhookId: null,
    author: { bot: false, avatarURL: () => null },
    channel: { id: 'chan', name: 'room' },
    member: { displayName: 'Ally' },
    content: 'hi',
    attachments: collectionOf<{ url: string }>({}),
    ...over,
  }) as unknown as Message;

  function webhooks(existing: boolean) {
    const send = vi.fn();
    const hook = {
      id: `hook-${Math.random()}`, channelId: 'x', name: 'Tripsit Bridge', send,
    };
    const channel = {
      fetchWebhooks: vi.fn(async () => collectionOf(existing ? { h: hook } : {})),
      createWebhook: vi.fn(async () => hook),
    };
    return { send, hook, channel };
  }

  beforeEach(() => { e.DISCORD_GUILD_ID = 'main'; });

  async function load() {
    vi.resetModules();
    return import('../../utils/bridge');
  }

  it('creates a webhook when none exists and caches it', async () => {
    const { sendMessageToChannel: send } = await load();
    const w = webhooks(false);
    w.hook.channelId = 'dest';
    (global as unknown as { discordClient: unknown }).discordClient = { channels: { fetch: vi.fn(async () => w.channel) } };
    await send('dest', baseMessage({ attachments: collectionOf({ a: { url: 'https://file' } }) }));
    await send('dest', baseMessage());
    expect(w.channel.createWebhook).toHaveBeenCalledTimes(1);
    expect(w.send).toHaveBeenCalledWith(expect.objectContaining({ username: 'Ally (Other)', files: ['https://file'] }));
    expect(w.send).toHaveBeenLastCalledWith(expect.objectContaining({ files: undefined }));
  });

  it('reuses an existing webhook', async () => {
    const { sendMessageToChannel: send } = await load();
    const w = webhooks(true);
    (global as unknown as { discordClient: unknown }).discordClient = { channels: { fetch: vi.fn(async () => w.channel) } };
    await send('dest', baseMessage());
    expect(w.channel.createWebhook).not.toHaveBeenCalled();
    expect(w.send).toHaveBeenCalled();
  });

  it('ignores DMs, webhooks and bots', async () => {
    const { bridgeMessage: bridge } = await load();
    await bridge(baseMessage({ guild: null }));
    await bridge(baseMessage({ webhookId: 'w' }));
    await bridge(baseMessage({ author: { bot: true } }));
    expect(dbMock.bridges.findMany).not.toHaveBeenCalled();
  });

  it('relays messages from the main guild to active external channels only', async () => {
    const { bridgeMessage: bridge } = await load();
    const w = webhooks(true);
    (global as unknown as { discordClient: unknown }).discordClient = { channels: { fetch: vi.fn(async () => w.channel) } };
    dbMock.bridges.findMany.mockResolvedValue([
      { status: 'ACTIVE', internal_channel: 'chan', external_channel: 'ext1' },
      { status: 'PAUSED', internal_channel: 'chan', external_channel: 'ext2' },
    ] as never);
    await bridge(baseMessage({ guildId: 'main' }));
    expect(w.send).toHaveBeenCalledTimes(1);
  });

  it('does nothing for unbridged main-guild channels', async () => {
    const { bridgeMessage: bridge } = await load();
    dbMock.bridges.findMany.mockResolvedValue([]);
    await bridge(baseMessage({ guildId: 'main' }));
  });

  it('relays external messages to the home channel and sibling bridges', async () => {
    const { bridgeMessage: bridge } = await load();
    const w = webhooks(true);
    (global as unknown as { discordClient: unknown }).discordClient = { channels: { fetch: vi.fn(async () => w.channel) } };
    dbMock.bridges.findMany
      .mockResolvedValueOnce([{ status: 'ACTIVE', internal_channel: 'home', external_channel: 'chan' }] as never)
      .mockResolvedValueOnce([
        { status: 'ACTIVE', internal_channel: 'home', external_channel: 'chan' },
        { status: 'ACTIVE', internal_channel: 'home', external_channel: 'sibling' },
        { status: 'PAUSED', internal_channel: 'home', external_channel: 'paused' },
      ] as never);
    await bridge(baseMessage());
    expect(w.send).toHaveBeenCalledTimes(2);
  });

  it('ignores external channels that are unbridged or inactive', async () => {
    const { bridgeMessage: bridge } = await load();
    dbMock.bridges.findMany.mockResolvedValueOnce([]);
    await bridge(baseMessage());
    dbMock.bridges.findMany.mockResolvedValueOnce([{ status: 'PAUSED', internal_channel: 'h', external_channel: 'chan' }] as never);
    await bridge(baseMessage());
    expect(dbMock.bridges.findMany).toHaveBeenCalledTimes(2);
  });
});
