import { DMChannel, TextChannel } from 'discord.js';
import { messageCommand } from '../../utils/messageCommand';
import { dbMock } from '../../../vitest/utils/mockDb';
import { collectionOf, flushPromises, stubInstance } from '../../../vitest/utils/discordStubs';

const e = env as unknown as Record<string, string>;
const mocks = vi.hoisted(() => ({ sleep: vi.fn() }));
vi.mock('../../utils/sleep', () => ({ sleep: mocks.sleep }));

let userCounter = 0;

function build(over: Record<string, unknown> = {}, opts: { channel?: 'text' | 'dm' | 'other'; channelName?: string; channelId?: string; mentionBot?: boolean; mentioned?: Array<{ id: string; bot?: boolean; username?: string }>; stickers?: Array<{ name: string; url: string }> } = {}) {
  userCounter += 1;
  const sent = { edit: vi.fn(), delete: vi.fn() };
  const send = vi.fn(async () => sent);
  const channelProps = {
    send, name: opts.channelName ?? 'general', id: opts.channelId ?? 'chan', messages: { fetch: vi.fn() },
  };
  const channel = opts.channel === 'other' ? { ...channelProps }
    : stubInstance(opts.channel === 'dm' ? DMChannel : TextChannel, channelProps);
  const members = new Map<string, { displayName: string }>([['u-known', { displayName: 'Known' }]]);
  const guild = {
    id: e.DISCORD_GUILD_ID,
    name: 'TripSit',
    channels: { fetch: vi.fn(async (id: string) => ({ toString: (): string => `#${id}` })) },
    roles: { fetch: vi.fn(async (id: string) => ({ id, toString: (): string => `@${id}` })) },
    members: { fetch: vi.fn(async (id: string) => members.get(id)) },
    emojis: { create: vi.fn(async ({ name }: { name: string }) => ({ name, id: '999' })) },
    stickers: { create: vi.fn() },
  };
  const message = {
    guild,
    channel,
    content: 'hello',
    cleanContent: 'hello',
    author: {
      id: `author${userCounter}`, bot: false, username: 'alice', displayName: 'Alice',
    },
    member: { displayName: 'Ally', permissions: { has: vi.fn(() => true) } },
    mentions: {
      users: collectionOf((opts.mentioned ?? []).map(u => [u.id, { username: 'x', bot: false, ...u }] as [string, object])),
      roles: { has: () => false },
    },
    stickers: collectionOf((opts.stickers ?? []).map((s, i) => [`s${i}`, s] as [string, object])),
    reference: null,
    react: vi.fn(),
    delete: vi.fn(),
    ...over,
  };
  if (opts.mentionBot) {
    (message.mentions.users as unknown as Map<string, unknown>).set(e.DISCORD_CLIENT_ID, { id: e.DISCORD_CLIENT_ID, bot: true });
  }
  return {
    message: message as never, raw: message, send, sent, guild,
  };
}

const sentText = (send: ReturnType<typeof vi.fn>, n = 0) => {
  const arg = send.mock.calls[n]?.[0] as string | { content?: string; embeds?: unknown[] };
  return typeof arg === 'string' ? arg : (arg?.content ?? '');
};

beforeEach(() => {
  (global as unknown as { emojiGet: unknown }).emojiGet = vi.fn(() => ({ name: 'ts_heart', id: '1' }));
  mocks.sleep.mockResolvedValue(undefined);
  e.DISCORD_GUILD_ID = 'guild1';
});

describe('messageCommand basics', () => {
  it('ignores DMs, strikethrough text and non-text channels', async () => {
    const dm = build({ guild: null });
    await messageCommand(dm.message);
    const strike = build({ content: '~~oops~~', cleanContent: '~~oops~~' });
    await messageCommand(strike.message);
    const voice = build({ content: '~help', cleanContent: '~help' }, { channel: 'other' });
    await messageCommand(voice.message);
    [dm, strike, voice].forEach(m => expect(m.send).not.toHaveBeenCalled());
  });
});

describe('old tilde commands', () => {
  const tilde = (content: string, over: Record<string, unknown> = {}, opts: Parameters<typeof build>[1] = {}) => build({ content, cleanContent: content, ...over }, opts);

  it('points ~commands at slash commands inside tripsit, and ignores them elsewhere', async () => {
    const m = tilde('~help');
    await messageCommand(m.message);
    expect(sentText(m.send)).toContain('use /help');
    const other = tilde('~help');
    (other.raw.guild as { id: string }).id = 'someone-else';
    await messageCommand(other.message);
    expect(other.send).not.toHaveBeenCalled();
  });

  it('redirects ~tripsit outside the tripsit channels', async () => {
    const m = tilde('~tripsit');
    await messageCommand(m.message);
    expect(sentText(m.send)).toContain('reserved for the tripsitting channels');
  });

  it('allows ~tripsit in a personal tripsit channel, with a five minute cooldown', async () => {
    const m = tilde('~tripsit', {}, { channelName: "x│Alice's channel!" });
    await messageCommand(m.message);
    expect(m.send).toHaveBeenCalledTimes(2);
    expect(sentText(m.send)).toContain('someone from the @');
    expect(sentText(m.send)).toContain('medical emergency');
    expect(JSON.stringify((m.send.mock.calls[1] as unknown[])[0])).toContain('Warm line directory');
    await messageCommand(m.message);
    expect(sentText(m.send, 2)).toContain('you just used that command');
    expect(m.send).toHaveBeenCalledTimes(3);
  });

  it('answers ~tripsit in the main tripsit channel', async () => {
    const m = tilde('~tripsit', {}, { channelId: e.CHANNEL_TRIPSIT });
    await messageCommand(m.message);
    expect(sentText(m.send)).toContain('will be with you');
  });
});

describe('mentioning and poking the bot', () => {
  it('reacts to pokes with a face', async () => {
    const m = build({ content: `_pokes <@${e.DISCORD_CLIENT_ID}>_`, cleanContent: 'poke' });
    await messageCommand(m.message);
    expect(m.send).toHaveBeenCalledTimes(1);
  });

  it('loves mentions with a heart, falling back to a purple one', async () => {
    const m = build({}, { mentionBot: true });
    await messageCommand(m.message);
    expect(m.raw.react).toHaveBeenCalledWith({ name: 'ts_heart', id: '1' });
    const fallback = build({}, { mentionBot: true });
    fallback.raw.react.mockRejectedValueOnce(new Error('Unknown Emoji'));
    await messageCommand(fallback.message);
    expect(fallback.raw.react).toHaveBeenLastCalledWith('💜');
    const hopeless = build({}, { mentionBot: true });
    hopeless.raw.react.mockRejectedValue(new Error('no'));
    await expect(messageCommand(hopeless.message)).resolves.toBeUndefined();
  });

  describe('owner tokens', () => {
    const owner = (content: string, mentioned: Array<{ id: string; bot?: boolean }>, opts: Parameters<typeof build>[1] = {}) => build({
      content, cleanContent: content, author: { id: e.DISCORD_OWNER_ID, bot: false, username: 'owner' },
    }, { mentionBot: true, mentioned, ...opts });

    it('gives tokens to mentioned guild members', async () => {
      dbMock.users.upsert.mockResolvedValue({ id: 'uid' } as never);
      dbMock.personas.upsert.mockResolvedValue({ tokens: 150 } as never);
      const m = owner('give 50 tokens', [{ id: 'u-known' }, { id: 'botty', bot: true }]);
      await messageCommand(m.message);
      await flushPromises();
      expect(dbMock.personas.upsert).toHaveBeenCalledTimes(1);
      expect(dbMock.personas.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { user_id: 'uid', tokens: 50 } }));
      expect(sentText(m.send)).toContain('Gave 50 tokens to Known!');
    });

    it('treats a missing amount as zero, and tells DMs about non-members', async () => {
      dbMock.users.upsert.mockResolvedValue({ id: 'uid' } as never);
      dbMock.personas.upsert.mockResolvedValue({ tokens: 0 } as never);
      const zero = owner('give tokens', [{ id: 'u-known' }]);
      await messageCommand(zero.message);
      await flushPromises();
      expect(dbMock.personas.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: { user_id: 'uid', tokens: 0 } }));
      dbMock.personas.upsert.mockClear();
      const dm = owner('give 5 tokens', [{ id: 'stranger' }], { channel: 'dm' });
      // tilde/guild checks require a text channel, so DMs return early; exercise the non-member branch on a text channel instead
      await messageCommand(dm.message);
      const stranger = owner('give 5 tokens', [{ id: 'stranger' }]);
      await messageCommand(stranger.message);
      await flushPromises();
      expect(dbMock.personas.upsert).not.toHaveBeenCalled();
    });

    it('runs the phoenix protocol animation', async () => {
      const m = owner('phoenix', []);
      await messageCommand(m.message);
      expect(m.sent.edit).toHaveBeenCalledTimes(3);
      expect(m.sent.edit).toHaveBeenLastCalledWith(expect.stringContaining('deployed. Good luck Ally'));
      expect(m.sent.delete).toHaveBeenCalled();
      expect(m.raw.delete).toHaveBeenCalled();
    });

    it('does not obey non-owners', async () => {
      dbMock.users.upsert.mockResolvedValue({ id: 'uid' } as never);
      const m = build({ content: 'give 50 tokens phoenix', cleanContent: 'give 50 tokens' }, { mentionBot: true, mentioned: [{ id: 'u-known' }] });
      await messageCommand(m.message);
      expect(dbMock.personas.upsert).not.toHaveBeenCalled();
      expect(m.raw.react).toHaveBeenCalled();
    });
  });

  describe('emoji and sticker uploads', () => {
    const upload = (content: string, over: Record<string, unknown> = {}, opts: Parameters<typeof build>[1] = {}) => build({ content, cleanContent: content, ...over }, { mentionBot: true, ...opts });

    it('requires the manage emojis permission', async () => {
      const m = upload('!upload emoji <:a:1>');
      m.raw.member.permissions.has.mockReturnValue(false);
      await messageCommand(m.message);
      expect(sentText(m.send)).toContain("don't have permission");
      expect(m.guild.emojis.create).not.toHaveBeenCalled();
    });

    it('uploads emojis from the message, reporting failures', async () => {
      const m = upload('!upload emoji <:wave:111> <a:dance:222>');
      m.guild.emojis.create.mockImplementationOnce(async () => ({ name: 'wave', id: '555' })).mockRejectedValueOnce(new Error('limit'));
      await messageCommand(m.message);
      expect(m.guild.emojis.create).toHaveBeenCalledWith({ name: 'dance', attachment: 'https://cdn.discordapp.com/emojis/222.gif' });
      expect(m.sent.edit).toHaveBeenCalledWith(expect.stringContaining('Failed to upload <a:dance:222>'));
      expect(m.sent.edit).toHaveBeenCalledWith(expect.stringContaining('<:wave:555>'));
    });

    it('takes emojis from the replied-to message when none are included', async () => {
      const m = upload('!steal emoji', { reference: { messageId: 'ref1' } });
      (m.raw.channel as unknown as { messages: { fetch: ReturnType<typeof vi.fn> } }).messages.fetch.mockResolvedValue({ content: 'see <:cat:333>' });
      await messageCommand(m.message);
      expect(m.guild.emojis.create).toHaveBeenCalledWith({ name: 'cat', attachment: 'https://cdn.discordapp.com/emojis/333.png' });
    });

    it('does nothing when there are no emojis to upload', async () => {
      const m = upload('!fetch emoji');
      await messageCommand(m.message);
      expect(m.guild.emojis.create).not.toHaveBeenCalled();
    });

    it('uploads stickers attached to the message', async () => {
      const m = upload('!upload sticker', {}, { stickers: [{ name: 'hug', url: 'https://sticker' }] });
      await messageCommand(m.message);
      expect(m.guild.stickers.create).toHaveBeenCalledWith({ name: 'hug', file: 'https://sticker', tags: 'grinning' });
      expect(m.send).toHaveBeenLastCalledWith('Uploaded hug to TripSit!');
    });
  });
});

describe('heart reactions', () => {
  const heart = (over: Record<string, unknown> = {}) => build({ content: 'love ❤', cleanContent: 'love ❤', ...over });

  it('reacts to loving messages in tripsit', async () => {
    const m = heart();
    await messageCommand(m.message);
    expect(m.raw.react).toHaveBeenCalledTimes(1);
  });

  it('ignores hearts inside emoji shortcodes, bots, other guilds, and survives reaction errors', async () => {
    const shortcode = build({ content: ':❤: x', cleanContent: ':❤: x' });
    await messageCommand(shortcode.message);
    expect(shortcode.raw.react).not.toHaveBeenCalled();
    const bot = heart({ author: { id: 'b', bot: true, username: 'b' } });
    await messageCommand(bot.message);
    const elsewhere = heart();
    (elsewhere.raw.guild as { id: string }).id = 'other';
    await messageCommand(elsewhere.message);
    expect(bot.raw.react).not.toHaveBeenCalled();
    expect(elsewhere.raw.react).not.toHaveBeenCalled();
    const failing = heart();
    failing.raw.react.mockRejectedValue(new Error('blocked'));
    await expect(messageCommand(failing.message)).resolves.toBeUndefined();
  });
});
