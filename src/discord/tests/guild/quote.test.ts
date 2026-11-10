/* eslint-disable no-restricted-syntax, max-len, sonarjs/no-duplicate-string */
import { dQuote, quoteAdd } from '../../commands/guild/d.quote';
import { lastReply, slashStub } from '../../../vitest/utils/commandStubs';
import { collectionOf } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({ user: vi.fn() }));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/utils/dbRecords', () => ({ getOrCreateUser: mocks.user }));
vi.mock('../../../global/utils/random', () => ({ randomItem: (items: unknown[]) => items[0] }));

const e = env as unknown as Record<string, string>;
type Embed = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const embeds = (s: ReturnType<typeof slashStub>): Embed[] => lastReply(s).embeds as Embed[];
const replyArg = (s: ReturnType<typeof slashStub>): Embed => s.reply.mock.calls[0][0] as Embed;

const quoteRow = (over: Record<string, unknown> = {}) => ({
  id: 'q1', user_id: 'dbu', quote: 'hello world', url: 'https://discord.com/channels/1/222/333', date: new Date('2024-01-01'), ...over,
});
const member = (id = 'author', over: Record<string, unknown> = {}) => ({
  id, displayName: 'Author', displayColor: 5, user: { username: 'author', displayAvatarURL: () => 'https://av', bot: false }, toString: (): string => '<@author>', ...over,
});
const attachment = (name: string, contentType: string | null) => ({ name, contentType, url: `https://cdn/${name}` });

const guildWith = (message: unknown, authorMember: unknown = member()) => ({
  id: e.DISCORD_GUILD_ID.toString(),
  members: { fetch: vi.fn(async () => { if (!authorMember) throw new Error('gone'); return authorMember; }) },
  channels: { fetch: vi.fn(async () => (message === undefined ? null : { isTextBased: () => true, messages: { fetch: vi.fn(async () => message) } })) },
});

describe('quote get', () => {
  beforeEach(() => {
    db.users.findFirstOrThrow = vi.fn().mockResolvedValue({ id: 'dbu', discord_id: 'author' }) as never;
  });

  it('requires a guild and search terms', async () => {
    const dm = slashStub({ guild: null, subcommand: 'get' });
    await dQuote.execute(dm as never);
    expect(dm.reply).not.toHaveBeenCalled();
    const none = slashStub({ subcommand: 'get' });
    await dQuote.execute(none as never);
    expect(replyArg(none).content).toContain('either a quote or a user');
  });

  it('reports no matches for each search type', async () => {
    db.quotes.findFirst = vi.fn().mockResolvedValue(null) as never;
    db.quotes.findMany = vi.fn().mockResolvedValue([]) as never;
    const user = { id: 'u', username: 'bob' };
    for (const [options, text] of [
      [{ user }, 'No quotes found for bob'],
      [{ quote: 'x' }, 'No quote containing "x" found'],
      [{ quote: 'x', user }, 'by bob found'],
    ] as Array<[Record<string, unknown>, string]>) {
      const stub = slashStub({ subcommand: 'get', options });
      // eslint-disable-next-line no-await-in-loop
      await dQuote.execute(stub as never);
      expect(replyArg(stub).content).toContain(text);
    }
    db.quotes.findMany = vi.fn().mockResolvedValue([]) as never;
    db.quotes.findFirst = vi.fn().mockResolvedValue(null) as never;
    // user search that finds nothing via findFirst path is the quote path; covered above
  });

  it('shows a quote with its author and source images', async () => {
    db.quotes.findFirst = vi.fn().mockResolvedValue(quoteRow()) as never;
    const message = {
      attachments: collectionOf({ a: attachment('pic.png', 'image/png'), b: attachment('doc.pdf', 'application/pdf'), c: attachment('x.jpg', null) }),
      embeds: [{ image: { url: 'https://prev' } }, { thumbnail: { url: 'https://thumb' } }, {}],
    };
    const stub = slashStub({ subcommand: 'get', options: { quote: 'hello' }, guild: guildWith(message) });
    await dQuote.execute(stub as never);
    const [first, ...rest] = embeds(stub);
    expect(first.description).toContain('> **hello world**');
    expect(first.description).toContain('[doc.pdf](https://cdn/doc.pdf)');
    expect(first.image.url).toBe('https://cdn/pic.png');
    expect(first.thumbnail.url).toBe('https://av');
    expect(rest.length).toBe(3);
  });

  it('searches by user with a random pick and survives a departed author', async () => {
    db.quotes.findMany = vi.fn().mockResolvedValue([quoteRow({ quote: 'No text (Image)', url: null })]) as never;
    const stub = slashStub({ subcommand: 'get', options: { user: { id: 'author', username: 'author' } }, guild: guildWith(undefined, null) });
    await dQuote.execute(stub as never);
    expect(embeds(stub)[0].description).toContain('Unknown User');
    expect(embeds(stub)[0].description).toContain('No source URL');
  });

  it('notes when the source message or image is gone', async () => {
    db.quotes.findFirst = vi.fn().mockResolvedValue(quoteRow()) as never;
    const gone = guildWith(undefined);
    gone.channels.fetch = vi.fn().mockRejectedValue({ code: 10008 });
    const a = slashStub({ subcommand: 'get', options: { quote: 'h' }, guild: gone });
    await dQuote.execute(a as never);
    expect(embeds(a)[0].description).toContain('no longer available');
    db.quotes.findFirst = vi.fn().mockResolvedValue(quoteRow({ quote: 'No text (Image)' })) as never;
    const other = guildWith(undefined);
    other.channels.fetch = vi.fn().mockRejectedValue(new Error('boom'));
    const b = slashStub({ subcommand: 'get', options: { quote: 'h' }, guild: other });
    await dQuote.execute(b as never);
    expect(embeds(b)[0].description).toContain('image attached');
    db.quotes.findFirst = vi.fn().mockResolvedValue(quoteRow()) as never;
    const notText = guildWith(undefined);
    notText.channels.fetch = vi.fn(async () => ({ isTextBased: () => false })) as never;
    const c = slashStub({ subcommand: 'get', options: { quote: 'h' }, guild: notText });
    await dQuote.execute(c as never);
    expect(embeds(c)[0].description).toContain('no longer available');
  });
});

describe('quote random', () => {
  beforeEach(() => {
    db.users.findFirstOrThrow = vi.fn().mockResolvedValue({ id: 'dbu', discord_id: 'author' }) as never;
  });

  it('handles an empty table', async () => {
    db.quotes.count = vi.fn().mockResolvedValue(0) as never;
    const stub = slashStub({ subcommand: 'random' });
    await dQuote.execute(stub as never);
    expect(lastReply(stub).content).toBe('No quotes found!');
  });

  it('shows a random quote', async () => {
    db.quotes.count = vi.fn().mockResolvedValue(3) as never;
    db.quotes.findFirst = vi.fn().mockResolvedValue(quoteRow({ url: null })) as never;
    const stub = slashStub({ subcommand: 'random', guild: guildWith(undefined, null) });
    await dQuote.execute(stub as never);
    expect(embeds(stub)[0].author.name).toContain('Unknown User');
    const known = slashStub({ subcommand: 'random', guild: guildWith(undefined) });
    await dQuote.execute(known as never);
    expect(embeds(known)[0].description).toBe('**hello world**');
    db.quotes.findFirst = vi.fn().mockResolvedValue(null) as never;
    await dQuote.execute(slashStub({ subcommand: 'random' }) as never);
  });

  it('omits the text for image-only quotes with a live image', async () => {
    db.quotes.count = vi.fn().mockResolvedValue(1) as never;
    db.quotes.findFirst = vi.fn().mockResolvedValue(quoteRow({ quote: 'No text (Image)' })) as never;
    const message = { attachments: collectionOf({ a: attachment('p.png', 'image/png') }), embeds: [] };
    const stub = slashStub({ subcommand: 'random', guild: guildWith(message) });
    await dQuote.execute(stub as never);
    expect(embeds(stub)[0].description).toBeUndefined();
  });
});

describe('quote delete', () => {
  const setup = (actorOver: Record<string, unknown> = {}, userId = 'author') => {
    db.quotes.findFirst = vi.fn().mockResolvedValue(quoteRow()) as never;
    db.quotes.delete = vi.fn() as never;
    db.users.findFirstOrThrow = vi.fn().mockResolvedValue({ id: 'dbu', discord_id: 'author' }) as never;
    db.discord_guilds.findFirstOrThrow = vi.fn().mockResolvedValue({ role_moderator: 'mod' }) as never;
    const log = { send: vi.fn() };
    (global as unknown as Record<string, unknown>).discordClient = { channels: { fetch: vi.fn(async () => log) } };
    const stub = slashStub({
      subcommand: 'delete',
      options: { quote: 'hello' },
      user: { id: userId, displayAvatarURL: () => 'https://av' },
      guild: guildWith(undefined),
      member: {
        id: userId, displayName: 'Actor', roles: { cache: new Set<string>() }, ...actorOver,
      },
    });
    return { stub, log };
  };

  it('guards guild, member and missing quotes', async () => {
    await dQuote.execute(slashStub({ guild: null, subcommand: 'delete', options: { quote: 'x' } }) as never);
    await dQuote.execute(slashStub({ member: null, subcommand: 'delete', options: { quote: 'x' } }) as never);
    db.quotes.findFirst = vi.fn().mockResolvedValue(null) as never;
    const stub = slashStub({ subcommand: 'delete', options: { quote: 'x' } });
    await dQuote.execute(stub as never);
    expect(replyArg(stub).content).toBe('Quote not found!');
  });

  it('only owners and moderators may delete', async () => {
    const stranger = setup({}, 'someone');
    await dQuote.execute(stranger.stub as never);
    expect(replyArg(stranger.stub).content).toContain('do not own');
    expect(db.quotes.delete).not.toHaveBeenCalled();
    const owner = setup({}, 'author');
    await dQuote.execute(owner.stub as never);
    expect(db.quotes.delete).toHaveBeenCalledWith({ where: { id: 'q1' } });
    expect(owner.log.send).toHaveBeenCalled();
    const mod = setup({ roles: { cache: new Set(['mod']) } }, 'someone');
    await dQuote.execute(mod.stub as never);
    expect(db.quotes.delete).toHaveBeenCalled();
  });

  it('unknown subcommands', async () => {
    const stub = slashStub({ subcommand: 'zzz' });
    expect(await dQuote.execute(stub as never)).toBe(true);
    expect(replyArg(stub).content).toBe('Unknown subcommand!');
  });
});

describe('quoteAdd', () => {
  const msg = (over: Record<string, unknown> = {}) => ({
    fetch: vi.fn(), member: member(), content: ' saved text ', url: 'https://discord.com/channels/1/2/3', createdAt: new Date(), reply: vi.fn(), ...over,
  });
  const ctx = (targetMessage: unknown, actorOver: Record<string, unknown> = {}, guildId = e.DISCORD_GUILD_ID.toString()) => {
    const log = { send: vi.fn() };
    (global as unknown as Record<string, unknown>).discordClient = { channels: { fetch: vi.fn(async () => log) } };
    return {
      id: 'i',
      deferReply: vi.fn(),
      editReply: vi.fn(),
      targetMessage,
      guild: guildId ? { id: guildId } : null,
      member: {
        id: 'actor', displayName: 'Actor', roles: { cache: { has: () => true } }, ...actorOver,
      },
      user: { displayAvatarURL: () => 'https://av' },
      log,
    };
  };
  const text = (c: ReturnType<typeof ctx>) => (c.editReply.mock.calls.at(-1)?.[0] as Embed).content;

  beforeEach(() => {
    mocks.user.mockResolvedValue({ id: 'dbu' });
    db.quotes.findFirst = vi.fn().mockResolvedValue(null) as never;
    db.quotes.create = vi.fn().mockResolvedValue(quoteRow()) as never;
  });

  it('needs the home guild', async () => {
    expect(await quoteAdd(ctx(msg(), {}, '') as never)).toBe(false);
    expect(await quoteAdd(ctx(msg(), {}, 'other') as never)).toBe(false);
  });

  it('rejects authorless, bot and under-level cases and duplicates', async () => {
    const noAuthor = ctx(msg({ member: null }));
    await quoteAdd(noAuthor as never);
    expect(text(noAuthor)).toContain('have an author');
    const bot = ctx(msg({ member: member('b', { user: { bot: true } }) }));
    await quoteAdd(bot as never);
    expect(text(bot)).toContain('humans');
    const lowLevel = ctx(msg(), { roles: { cache: { has: () => false } } });
    await quoteAdd(lowLevel as never);
    expect(text(lowLevel)).toContain('level 10');
    db.quotes.findFirst = vi.fn().mockResolvedValue(quoteRow()) as never;
    const dup = ctx(msg());
    await quoteAdd(dup as never);
    expect(text(dup)).toContain('already');
  });

  // Regression test for TripSit/TripBot#1328: the owner check used to be always false, so self-quotes were never blocked.
  it('blocks saving your own messages (#1328)', async () => {
    const own = ctx(msg({ member: member('actor') }));
    await quoteAdd(own as never);
    expect(text(own)).toContain('own messages');
  });

  it('saves a quote and logs it, using a placeholder for image-only messages', async () => {
    const c = ctx(msg());
    expect(await quoteAdd(c as never)).toBe(true);
    expect(db.quotes.create).toHaveBeenCalledWith({ data: expect.objectContaining({ quote: 'saved text' }) });
    expect(c.log.send).toHaveBeenCalled();
    const image = ctx(msg({ content: '   ' }));
    await quoteAdd(image as never);
    expect(db.quotes.create).toHaveBeenLastCalledWith({ data: expect.objectContaining({ quote: 'No text (Image)' }) });
  });
});

describe('quote edge cases', () => {
  beforeEach(() => {
    db.users.findFirstOrThrow = vi.fn().mockResolvedValue({ id: 'dbu', discord_id: 'author' }) as never;
    db.quotes.count = vi.fn().mockResolvedValue(1) as never;
  });

  it('random ignores DMs', async () => {
    const stub = slashStub({ guild: null, subcommand: 'random' });
    await dQuote.execute(stub as never);
    expect(stub.deferReply).not.toHaveBeenCalled();
  });

  it('random lists non-image attachments and notes a missing source', async () => {
    db.quotes.findFirst = vi.fn().mockResolvedValue(quoteRow()) as never;
    const withFile = { attachments: collectionOf({ a: attachment('doc.pdf', 'application/pdf') }), embeds: [] };
    const stub = slashStub({ subcommand: 'random', guild: guildWith(withFile) });
    await dQuote.execute(stub as never);
    expect(embeds(stub)[0].description).toContain('[doc.pdf](https://cdn/doc.pdf)');

    const gone = guildWith(undefined);
    gone.channels.fetch = vi.fn().mockRejectedValue({ code: 10008 });
    const missing = slashStub({ subcommand: 'random', guild: gone });
    await dQuote.execute(missing as never);
    expect(embeds(missing)[0].description).toContain('no longer available');
  });

  it('shows a group of images and a quote with no url', async () => {
    db.quotes.findFirst = vi.fn().mockResolvedValue(quoteRow({ quote: 'caption' })) as never;
    const many = { attachments: collectionOf({ a: attachment('1.png', 'image/png'), b: attachment('2.png', 'image/png') }), embeds: [] };
    const stub = slashStub({ subcommand: 'get', options: { quote: 'cap' }, guild: guildWith(many) });
    await dQuote.execute(stub as never);
    expect(embeds(stub)).toHaveLength(2);
    expect(embeds(stub)[1].image.url).toBe('https://cdn/2.png');
  });

  it('get and delete quietly stop for authors without a Discord id', async () => {
    db.users.findFirstOrThrow = vi.fn().mockResolvedValue({ id: 'dbu', discord_id: null }) as never;
    db.quotes.findFirst = vi.fn().mockResolvedValue(quoteRow()) as never;
    const get = slashStub({ subcommand: 'get', options: { quote: 'x' } });
    await dQuote.execute(get as never);
    expect(get.deferReply).not.toHaveBeenCalled();
    const del = slashStub({ subcommand: 'delete', options: { quote: 'x' } });
    await dQuote.execute(del as never);
    expect(del.reply).not.toHaveBeenCalled();
  });

  it('lets the owner save their own message but not anyone else', async () => {
    mocks.user.mockResolvedValue({ id: 'dbu' });
    db.quotes.findFirst = vi.fn().mockResolvedValue(null) as never;
    db.quotes.create = vi.fn().mockResolvedValue(quoteRow()) as never;
    const log = { send: vi.fn() };
    (global as unknown as Record<string, unknown>).discordClient = { channels: { fetch: vi.fn(async () => log) } };
    const mine = member(e.DISCORD_OWNER_ID);
    const targetMessage = {
      fetch: vi.fn(), member: mine, content: 'self', url: 'https://discord.com/channels/1/2/3', createdAt: new Date(), reply: vi.fn(),
    };
    const interaction = {
      id: 'i', deferReply: vi.fn(), editReply: vi.fn(), targetMessage, guild: { id: e.DISCORD_GUILD_ID.toString() },
      member: { id: e.DISCORD_OWNER_ID, displayName: 'Owner', roles: { cache: { has: () => true } } }, user: { displayAvatarURL: () => 'https://av' },
    };
    await quoteAdd(interaction as never);
    expect(db.quotes.create).toHaveBeenCalled();
  });
});
