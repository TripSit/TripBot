/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import { ChannelType, Collection } from 'discord.js';
import runTimer from '../../utils/timer';
import { dbMock } from '../../../vitest/utils/mockDb';

const mocks = vi.hoisted(() => ({
  updateDb: vi.fn(),
  checkPerms: vi.fn(),
  experience: vi.fn(),
  profile: vi.fn(),
  stats: vi.fn(),
  parseURL: vi.fn(),
}));

vi.mock('../../utils/updateDb', () => ({ default: mocks.updateDb }));
vi.mock('../../../discord/utils/checkPermissions', () => ({ checkChannelPermissions: mocks.checkPerms }));
vi.mock('../../utils/experience', () => ({ experience: mocks.experience }));
vi.mock('../../commands/g.learn', () => ({ profile: mocks.profile }));
vi.mock('../../commands/g.tripsitstats', () => ({ default: mocks.stats }));
vi.mock('rss-parser', () => ({ default: class { parseURL = mocks.parseURL; } }));
vi.mock('axios');

const e = env as unknown as Record<string, string>;
const originalEnv = e.NODE_ENV;

type Scheduled = { fn: () => Promise<void>; ms: number };
let scheduled: Scheduled[] = [];

// Timer order inside runTimer
const T = {
  reminders: 0, tickets: 1, mindsets: 2, uptime: 3, rss: 4, voice: 5, moodle: 6, updateDb: 7, bans: 8, monthly: 9, birthdays: 10,
};

const flush = async () => {
  for (let i = 0; i < 5; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise(resolve => { setImmediate(resolve); });
  }
};

async function start() {
  scheduled.length = 0;
  await runTimer();
  const initial = scheduled.slice();
  const run = async (index: keyof typeof T) => {
    await initial[T[index]].fn();
    await flush();
  };
  return { initial, run };
}

const past = () => new Date(Date.now() - 60_000);
const future = () => new Date(Date.now() + 3_600_000);

function makeGuild(overrides: Record<string, unknown> = {}) {
  const role = (id: string) => ({ id, name: `role-${id}`, comparePositionTo: () => -1 });
  const member = {
    displayName: 'Member',
    guild: { id: 'g1', name: 'Guild' },
    user: { username: 'member', send: vi.fn() },
    roles: { cache: new Set<string>(), add: vi.fn(), remove: vi.fn() },
  };
  const guild = {
    id: 'g1',
    name: 'Guild',
    channels: { fetch: vi.fn(async (): Promise<any> => ({ send: vi.fn(), name: 'chan' })) },
    members: {
      search: vi.fn(async () => ({ size: 1 })),
      fetch: vi.fn(async (): Promise<any> => member),
      me: { roles: { highest: {} } },
    },
    roles: { fetch: vi.fn(async (id: string): Promise<any> => role(id)) },
    bans: { remove: vi.fn() },
    ...overrides,
  };
  return { guild, member, role };
}

let sendBot: ReturnType<typeof vi.fn>;

beforeEach(() => {
  scheduled = [];
  vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => Promise<void>, ms: number) => {
    scheduled.push({ fn, ms });
    return 0;
  }) as never);
  e.NODE_ENV = 'test';
  sendBot = vi.fn();
  (global as unknown as { discordClient: unknown }).discordClient = {
    user: { setActivity: vi.fn() },
    users: { fetch: vi.fn(async (id: string) => ({ id, username: 'user', send: sendBot })) },
    guilds: { fetch: vi.fn(async () => makeGuild().guild) },
    channels: { fetch: vi.fn(async () => ({ send: sendBot })), cache: new Collection() },
    ws: { ping: 42 },
  };
  (global as unknown as { moodleConnection?: unknown }).moodleConnection = undefined;
  mocks.checkPerms.mockResolvedValue({ hasPermission: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  e.NODE_ENV = originalEnv;
});

const client = () => (global as unknown as { discordClient: Record<string, any> }).discordClient;

describe('runTimer', () => {
  it('sets presence and schedules every job', async () => {
    await runTimer();
    expect(client().user.setActivity).toHaveBeenCalled();
    expect(scheduled).toHaveLength(11);
    expect(scheduled.map(s => s.ms)).toEqual([
      5000, 10000, 5000, 5000, 5000, 5000, 5000, 48 * 3600000, 10000, 8 * 3600000, 8 * 3600000,
    ]);
  });

  it('uses production intervals in production', async () => {
    e.NODE_ENV = 'production';
    await runTimer();
    expect(scheduled.map(s => s.ms)).toEqual([
      10000, 60000, 60000, 60000, 30000, 60000, 60000, 24 * 3600000, 12 * 3600000, 24 * 3600000, 24 * 3600000,
    ]);
  });

  it('re-arms a job after it finishes', async () => {
    dbMock.user_reminders.findMany.mockResolvedValue([]);
    const { initial } = await (async () => { await runTimer(); return { initial: scheduled.slice() }; })();
    await initial[T.reminders].fn();
    expect(scheduled).toHaveLength(12);
    expect(scheduled[11].ms).toBe(5000);
  });

  it('runs the database updater on its schedule', async () => {
    const { run } = await start();
    await run('updateDb');
    expect(mocks.updateDb).toHaveBeenCalled();
  });
});

describe('reminders', () => {
  const reminder = (over: object = {}) => ({
    id: 'r1', user_id: 'u1', reminder_text: 'drink water', trigger_at: past(), ...over,
  });

  it('delivers due reminders by DM then deletes them', async () => {
    dbMock.user_reminders.findMany.mockResolvedValue([reminder()] as never);
    dbMock.users.upsert.mockResolvedValue({ discord_id: 'd1' } as never);
    const { run } = await start();
    await run('reminders');
    expect(sendBot).toHaveBeenCalledWith(expect.stringContaining('drink water'));
    expect(dbMock.user_reminders.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
  });

  it('still deletes when the DM fails or the user has no discord id', async () => {
    dbMock.user_reminders.findMany.mockResolvedValue([reminder(), reminder({ id: 'r2' })] as never);
    dbMock.users.upsert
      .mockResolvedValueOnce({ discord_id: 'd1' } as never)
      .mockResolvedValueOnce({ discord_id: null } as never);
    sendBot.mockRejectedValueOnce(new Error('DMs closed'));
    const { run } = await start();
    await run('reminders');
    expect(dbMock.user_reminders.delete).toHaveBeenCalledTimes(2);
  });

  it('leaves future reminders alone and tolerates a missing trigger date', async () => {
    dbMock.user_reminders.findMany.mockResolvedValue([reminder({ trigger_at: future() }), reminder({ trigger_at: null })] as never);
    const { run } = await start();
    await run('reminders');
    expect(dbMock.user_reminders.delete).not.toHaveBeenCalled();
    expect(sendBot).not.toHaveBeenCalled();
  });
});

describe('tickets', () => {
  const ticket = (over: object = {}) => ({
    id: 't1',
    user_id: 'u1',
    status: 'OPEN',
    archived_at: past(),
    deleted_at: null,
    thread_id: 'th',
    description: null,
    type: null,
    first_message_id: null,
    ...over,
  });

  function discordForArchive(roles: string | null = 'r1,r2') {
    const { guild, member } = makeGuild();
    const thread = {
      name: 'thread', guild: { id: 'g1' }, setArchived: vi.fn(), delete: vi.fn(),
    };
    client().channels.fetch = vi.fn(async () => thread);
    client().guilds.fetch = vi.fn(async () => guild);
    client().users.fetch = vi.fn(async () => ({ username: 'user' }));
    dbMock.users.upsert.mockResolvedValue({ id: 'u1', discord_id: 'd1', roles } as never);
    dbMock.discord_guilds.upsert.mockResolvedValue({ id: 'g1', role_needshelp: 'nh' } as never);
    return { guild, member, thread };
  }

  beforeEach(() => {
    dbMock.discord_guilds.findMany.mockResolvedValue([]);
  });

  it('archives expired tickets with sane defaults, archives the thread and restores roles', async () => {
    dbMock.user_tickets.findMany.mockResolvedValue([ticket()] as never);
    const { member, thread } = discordForArchive();
    const { run } = await start();
    await run('tickets');
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 't1' },
      data: expect.objectContaining({
        status: 'ARCHIVED', description: 'Ticket archived', type: 'TRIPSIT', first_message_id: '123',
      }),
    }));
    expect(thread.setArchived).toHaveBeenCalledWith(true);
    expect(member.roles.add).toHaveBeenCalledTimes(2);
    expect(member.roles.remove).toHaveBeenCalledTimes(1);
  });

  it('skips role restoration for users without stored roles and when role changes fail', async () => {
    dbMock.user_tickets.findMany.mockResolvedValue([ticket({ description: 'd', type: 'TRIPSIT', first_message_id: 'f' })] as never);
    const { member } = discordForArchive(null);
    const { run } = await start();
    await run('tickets');
    expect(member.roles.add).not.toHaveBeenCalled();

    dbMock.user_tickets.findMany.mockResolvedValue([ticket()] as never);
    const failing = discordForArchive();
    failing.member.roles.add.mockRejectedValue(new Error('missing perms'));
    await run('tickets');
    expect(failing.member.roles.add).toHaveBeenCalled();
  });

  it('tolerates a missing thread, missing member and unknown user', async () => {
    dbMock.user_tickets.findMany.mockResolvedValue([ticket()] as never);
    discordForArchive();
    client().channels.fetch = vi.fn(async () => { throw new Error('Unknown Channel'); });
    const { run } = await start();
    await run('tickets');
    expect(dbMock.user_tickets.update).toHaveBeenCalledTimes(1);

    const noSearch = discordForArchive();
    noSearch.guild.members.search.mockResolvedValue({ size: 0 });
    await run('tickets');

    dbMock.users.upsert.mockResolvedValue({ id: 'u1', discord_id: null } as never);
    await run('tickets');
  });

  it('uses the production retention period and tolerates tickets without a thread', async () => {
    e.NODE_ENV = 'production';
    dbMock.user_tickets.findMany.mockResolvedValue([ticket({ thread_id: null })] as never);
    discordForArchive();
    client().channels.fetch = vi.fn(async () => { throw new Error('no thread'); });
    const { run } = await start();
    await run('tickets');
    const update = dbMock.user_tickets.update.mock.calls[0][0] as { data: { deleted_at: Date } };
    const days = (update.data.deleted_at.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(2.9);
    expect(days).toBeLessThan(3.1);
  });

  it('skips role restoration when Discord returns nothing for the user, the member or the roles', async () => {
    dbMock.user_tickets.findMany.mockResolvedValue([ticket()] as never);
    const { run } = await start();

    const noUser = discordForArchive();
    client().users.fetch = vi.fn(async () => null);
    dbMock.user_tickets.findMany.mockResolvedValue([ticket()] as never);
    await run('tickets');
    expect(noUser.member.roles.add).not.toHaveBeenCalled();

    const noMember = discordForArchive();
    noMember.guild.members.fetch.mockResolvedValue(null);
    dbMock.user_tickets.findMany.mockResolvedValue([ticket()] as never);
    await run('tickets');
    expect(noMember.member.roles.add).not.toHaveBeenCalled();

    const odd = discordForArchive('gone,everyone,nh,high');
    const role = (id: string, name: string, position: number) => ({ id, name, comparePositionTo: () => position });
    odd.guild.roles.fetch.mockImplementation(async (id: string) => {
      if (id === 'gone') return null;
      if (id === 'everyone') return role(id, '@everyone', -1);
      if (id === 'nh') return role(id, 'needshelp', -1);
      if (id === 'high') return role(id, 'high', 1);
      return null;
    });
    dbMock.user_tickets.findMany.mockResolvedValue([ticket()] as never);
    await run('tickets');
    expect(odd.member.roles.add).not.toHaveBeenCalled();
    expect(odd.member.roles.remove).toHaveBeenCalledTimes(1);

    const higherNeedsHelp = discordForArchive('x');
    higherNeedsHelp.guild.roles.fetch.mockImplementation(async (id: string) => (id === 'nh' ? role(id, 'needshelp', 1) : null));
    dbMock.user_tickets.findMany.mockResolvedValue([ticket()] as never);
    await run('tickets');
    expect(higherNeedsHelp.member.roles.remove).not.toHaveBeenCalled();
  });

  it('does not touch tickets that are already archived, deleted or paused', async () => {
    dbMock.user_tickets.findMany.mockResolvedValue(
      ['ARCHIVED', 'DELETED', 'PAUSED'].map(status => ticket({ status, deleted_at: future() })) as never,
    );
    const { run } = await start();
    await run('tickets');
    expect(dbMock.user_tickets.update).not.toHaveBeenCalled();
  });

  it('deletes expired archived tickets and their threads', async () => {
    dbMock.user_tickets.findMany.mockResolvedValue([ticket({ status: 'ARCHIVED', deleted_at: past() })] as never);
    const thread = { delete: vi.fn() };
    client().channels.fetch = vi.fn(async () => thread);
    const { run } = await start();
    await run('tickets');
    expect(thread.delete).toHaveBeenCalled();
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { status: 'DELETED' } });
  });

  it('still marks the ticket deleted when the thread is already gone', async () => {
    dbMock.user_tickets.findMany.mockResolvedValue([ticket({ status: 'ARCHIVED', deleted_at: past(), thread_id: null })] as never);
    const { run } = await start();
    await run('tickets');
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { status: 'DELETED' } });

    dbMock.user_tickets.findMany.mockResolvedValue([ticket({ status: 'ARCHIVED', deleted_at: past() })] as never);
    client().channels.fetch = vi.fn(async () => { throw new Error('gone'); });
    await run('tickets');
  });

  describe('failsafe thread pruning', () => {
    const guildRow = () => ({ id: 'g1', channel_tripsit: 'ct' });
    const messages = (items: object[]) => ({ filter: (fn: (m: object) => boolean) => ({ first: () => items.filter(fn)[0] }) });

    beforeEach(() => {
      dbMock.user_tickets.findMany.mockResolvedValue([]);
      dbMock.discord_guilds.findMany.mockResolvedValue([guildRow()] as never);
    });

    it('ignores deleted guilds', async () => {
      client().guilds.fetch = vi.fn(async () => { throw new Error('Unknown Guild'); });
      const { run } = await start();
      await run('tickets');
      expect(mocks.checkPerms).not.toHaveBeenCalled();
    });

    it('clears the stored tripsit channel when it no longer exists', async () => {
      const { guild } = makeGuild();
      guild.channels.fetch = vi.fn(async () => { throw new Error('Unknown Channel'); });
      client().guilds.fetch = vi.fn(async () => guild);
      const { run } = await start();
      await run('tickets');
      expect(dbMock.discord_guilds.update).toHaveBeenCalledWith({ where: { id: 'g1' }, data: { channel_tripsit: null } });
    });

    it('skips guilds without a tripsit channel or without permissions', async () => {
      dbMock.discord_guilds.findMany.mockResolvedValue([{ id: 'g1', channel_tripsit: null }] as never);
      const { run } = await start();
      await run('tickets');
      expect(mocks.checkPerms).not.toHaveBeenCalled();

      dbMock.discord_guilds.findMany.mockResolvedValue([guildRow()] as never);
      mocks.checkPerms.mockResolvedValue({ hasPermission: false });
      const { guild } = makeGuild();
      const threadsFetch = vi.fn();
      guild.channels.fetch = vi.fn(async () => ({ threads: { fetch: threadsFetch } }));
      client().guilds.fetch = vi.fn(async () => guild);
      await run('tickets');
      expect(threadsFetch).not.toHaveBeenCalled();
    });

    it('inspects archived threads and tolerates failures', async () => {
      const recent = { createdAt: new Date(), system: false };
      const system = { createdAt: new Date(), system: true };
      const good = {
        name: 'a', fetch: vi.fn(), delete: vi.fn(), messages: { fetch: vi.fn(async () => messages([system, recent])) },
      };
      const empty = {
        name: 'b', fetch: vi.fn(), delete: vi.fn(), messages: { fetch: vi.fn(async () => messages([system])) },
      };
      const broken = { name: 'c', fetch: vi.fn(async () => { throw new Error('gone'); }), delete: vi.fn() };
      const threads = new Map<string, any>([['1', good], ['2', empty], ['3', broken]]);
      const { guild } = makeGuild();
      guild.channels.fetch = vi.fn(async () => ({ name: 'tripsit', threads: { fetch: vi.fn(async () => ({ threads })) } }));
      client().guilds.fetch = vi.fn(async () => guild);
      const { run } = await start();
      await run('tickets');
      expect(good.messages.fetch).toHaveBeenCalledWith({ limit: 10 });
      expect(empty.delete).not.toHaveBeenCalled();
      expect(broken.delete).not.toHaveBeenCalled();
    });
  });
});

describe('mindsets', () => {
  const user = (over: object = {}) => ({
    discord_id: 'd1', mindset_role: 'mr', mindset_role_expires_at: past(), ...over,
  });

  function setup(list: object[]) {
    dbMock.users.findMany.mockImplementation((async (args: { where?: { mindset_role?: unknown } }) => (
      args?.where?.mindset_role ? list : []
    )) as never);
  }

  it('removes expired mindset roles and clears them in the database', async () => {
    setup([user()]);
    const { guild, member } = makeGuild();
    client().guilds.fetch = vi.fn(async () => guild);
    const { run } = await start();
    await run('mindsets');
    expect(member.roles.remove).toHaveBeenCalled();
    expect(dbMock.users.update).toHaveBeenCalledWith({
      where: { discord_id: 'd1' }, data: { mindset_role: null, mindset_role_expires_at: null },
    });
  });

  it('ignores unexpired roles, users not in the guild, and missing roles', async () => {
    setup([user({ mindset_role_expires_at: future() }), user({ mindset_role_expires_at: null }), user({ discord_id: null })]);
    const { run } = await start();
    await run('mindsets');
    expect(dbMock.users.update).not.toHaveBeenCalled();

    setup([user()]);
    const none = makeGuild();
    none.guild.members.search.mockResolvedValue({ size: 0 });
    client().guilds.fetch = vi.fn(async () => none.guild);
    await run('mindsets');
    expect(dbMock.users.update).not.toHaveBeenCalled();

    const noRole = makeGuild();
    noRole.guild.roles.fetch.mockResolvedValue(null);
    client().guilds.fetch = vi.fn(async () => noRole.guild);
    await run('mindsets');
    expect(dbMock.users.update).not.toHaveBeenCalled();
  });
});

describe('rss', () => {
  const makeFeed = () => ({
    id: 'f1', url: 'https://feed', last_post_id: 'old', destination: 'dest',
  });
  const post = (over: object = {}) => ({
    id: 'new',
    title: 'A post',
    link: 'https://www.reddit.com/r/tripsit/comments/abc/a_post/',
    pubDate: '2024-01-01T00:00:00Z',
    contentSnippet: 'Hello body submitted by    /u/someone [link] [comments]',
    ...over,
  });

  function setup(items: object[] | Error) {
    dbMock.rss.findMany.mockResolvedValue([makeFeed()] as never);
    if (items instanceof Error) mocks.parseURL.mockRejectedValue(items);
    else mocks.parseURL.mockResolvedValue({ items });
    const send = vi.fn();
    const { guild } = makeGuild();
    guild.channels.fetch = vi.fn(async () => ({ send })) as never;
    client().guilds.fetch = vi.fn(async () => guild);
    return send;
  }

  it('posts new items and remembers the id', async () => {
    const send = setup([post()]);
    const { run } = await start();
    await run('rss');
    expect(send).toHaveBeenCalledTimes(1);
    const embed = send.mock.calls[0][0].embeds[0].data;
    expect(embed.author.name).toBe('New /r/tripsit post');
    expect(embed.description).toBe('Hello body');
    expect(dbMock.rss.update).toHaveBeenCalledWith({ where: { id: 'f1' }, data: { last_post_id: 'new' } });
  });

  it('omits the description for link-only posts', async () => {
    const send = setup([post({ contentSnippet: 'submitted by    /u/someone [link]' })]);
    const { run } = await start();
    await run('rss');
    expect(send.mock.calls[0][0].embeds[0].data.description).toBeUndefined();
  });

  it('skips already-seen posts, unreachable feeds and unusable items', async () => {
    let send = setup([post({ id: 'old' })]);
    const { run } = await start();
    await run('rss');
    expect(send).not.toHaveBeenCalled();

    send = setup(new Error('network'));
    await run('rss');
    expect(send).not.toHaveBeenCalled();

    send = setup([post({ pubDate: 'not a date' })]);
    await run('rss');
    expect(send).not.toHaveBeenCalled();
    expect(dbMock.rss.update).not.toHaveBeenCalled();
  });
});

describe('uptime', () => {
  it('pings the monitor only in production, ignoring failures', async () => {
    vi.mocked(axios.get).mockResolvedValue({});
    const dev = await start();
    await dev.run('uptime');
    expect(axios.get).not.toHaveBeenCalled();

    e.NODE_ENV = 'production';
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('down'));
    const prod = await start();
    await prod.run('uptime');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('ping=42'));
  });
});

describe('voice experience', () => {
  type VoiceOpts = Partial<{
    bot: boolean; selfDeaf: boolean; serverDeaf: boolean; selfMute: boolean; serverMute: boolean; suppress: boolean;
    stage: boolean; needsHelp: boolean;
  }>;
  const voiceMember = (id: string, o: VoiceOpts = {}) => ({
    id,
    displayName: id,
    user: { bot: !!o.bot },
    voice: {
      selfDeaf: !!o.selfDeaf,
      serverDeaf: !!o.serverDeaf,
      selfMute: !!o.selfMute,
      serverMute: !!o.serverMute,
      suppress: !!o.suppress,
      channel: { type: o.stage ? ChannelType.GuildStageVoice : ChannelType.GuildVoice },
    },
    roles: { cache: new Set(o.needsHelp ? [e.ROLE_NEEDS_HELP] : []) },
  });

  function setup(channels: object[]) {
    const children = new Collection(channels.map((c, i) => [`c${i}`, c]));
    // Several category definitions share an id in dev, so only serve the children once per run.
    let served = false;
    client().channels.fetch = vi.fn(async (id: string) => {
      const mine = id === e.CATEGORY_CAMPGROUND && !served;
      if (mine) served = true;
      return { children: { cache: mine ? children : new Collection() } };
    });
  }
  const voice = (members: ReturnType<typeof voiceMember>[], over: object = {}) => ({
    id: 'vc', type: ChannelType.GuildVoice, members: new Collection(members.map(m => [m.id, m])), ...over,
  });

  it('awards voice xp to eligible members', async () => {
    setup([voice([voiceMember('a'), voiceMember('b')])]);
    const { run } = await start();
    await run('voice');
    expect(mocks.experience).toHaveBeenCalledTimes(2);
    expect(mocks.experience).toHaveBeenCalledWith(expect.anything(), 'GENERAL', 'VOICE', expect.anything());
  });

  it.each<[string, VoiceOpts]>([
    ['bots', { bot: true }], ['self-deafened', { selfDeaf: true }], ['server-deafened', { serverDeaf: true }],
    ['self-muted', { selfMute: true }], ['server-muted', { serverMute: true }], ['suppressed', { suppress: true }],
    ['in stage channels', { stage: true }], ['needing help', { needsHelp: true }],
  ])('excludes members who are %s', async (_label, opts) => {
    setup([voice([voiceMember('a', opts)])]);
    const { run } = await start();
    await run('voice');
    expect(mocks.experience).not.toHaveBeenCalled();
  });

  it('ignores empty, non-voice and campfire channels', async () => {
    setup([
      voice([]), voice([voiceMember('a')], { type: ChannelType.GuildText }), voice([voiceMember('b')], { id: e.CHANNEL_CAMPFIRE }),
    ]);
    const { run } = await start();
    await run('voice');
    expect(mocks.experience).not.toHaveBeenCalled();
  });

  it('requires two active humans in production', async () => {
    e.NODE_ENV = 'production';
    setup([voice([voiceMember('a')])]);
    const prod = await start();
    await prod.run('voice');
    expect(mocks.experience).not.toHaveBeenCalled();

    setup([voice([voiceMember('a'), voiceMember('b')])]);
    await prod.run('voice');
    expect(mocks.experience).toHaveBeenCalledTimes(2);
  });
});

describe('moodle', () => {
  const COURSE = 'Intro to Tripsitting';
  const moodleUser = { discord_id: 'd1' };

  function setup(opts: { users?: object[]; needsHelp?: boolean; hasRole?: boolean; contentChannel?: boolean } = {}) {
    dbMock.users.findMany.mockImplementation((async (args: { where?: { moodle_id?: unknown } }) => (
      args?.where?.moodle_id ? (opts.users ?? [moodleUser]) : []
    )) as never);
    const { guild, member } = makeGuild();
    if (opts.needsHelp) member.roles.cache.add(e.ROLE_NEEDS_HELP);
    if (opts.hasRole) member.roles.cache.add(e.ROLE_TS100);
    const content = { send: vi.fn() };
    guild.channels.fetch = vi.fn(async (id: string) => (id === e.CHANNEL_CONTENT && opts.contentChannel === false ? null : content)) as never;
    (member.roles.cache as unknown as { has: (id: string) => boolean }).has = (id: string) => Set.prototype.has.call(member.roles.cache, id);
    client().guilds.fetch = vi.fn(async () => guild);
    return { guild, member, content };
  }

  it('congratulates and rewards members who completed the course', async () => {
    mocks.profile.mockResolvedValue({ completedCourses: [COURSE] });
    const { member, content } = setup();
    const { run } = await start();
    await run('moodle');
    expect(content.send).toHaveBeenCalled();
    expect(member.roles.add).toHaveBeenCalledWith(expect.objectContaining({ id: e.ROLE_TS100 }));
    expect(member.user.send).toHaveBeenCalled();
  });

  it('works without a content channel and when the DM fails', async () => {
    mocks.profile.mockResolvedValue({ completedCourses: [COURSE] });
    const { member } = setup({ contentChannel: false });
    member.user.send.mockRejectedValue(new Error('DMs closed'));
    const { run } = await start();
    await run('moodle');
    expect(member.roles.add).toHaveBeenCalled();
  });

  it('does not give the role to members who need help', async () => {
    mocks.profile.mockResolvedValue({ completedCourses: [COURSE] });
    const { member } = setup({ needsHelp: true });
    const { run } = await start();
    await run('moodle');
    expect(member.roles.add).not.toHaveBeenCalled();
    expect(member.user.send).toHaveBeenCalled();
  });

  it('does nothing for members who already have the role', async () => {
    mocks.profile.mockResolvedValue({ completedCourses: [COURSE] });
    const { member, content } = setup({ hasRole: true });
    const { run } = await start();
    await run('moodle');
    expect(content.send).not.toHaveBeenCalled();
    expect(member.roles.add).not.toHaveBeenCalled();
  });

  it('skips profiles without completions and unmapped courses', async () => {
    const { member } = setup();
    const { run } = await start();
    mocks.profile.mockResolvedValue({});
    await run('moodle');
    mocks.profile.mockResolvedValue({ completedCourses: [] });
    await run('moodle');
    mocks.profile.mockResolvedValue({ completedCourses: ['Unknown course'] });
    const { guild } = setup();
    guild.roles.fetch.mockResolvedValue(null);
    await run('moodle');
    expect(member.roles.add).not.toHaveBeenCalled();
  });

  it('survives role failures, missing members and profile errors', async () => {
    mocks.profile.mockResolvedValue({ completedCourses: [COURSE] });
    const failing = setup();
    failing.guild.roles.fetch.mockRejectedValue(new Error('discord'));
    const { run } = await start();
    await run('moodle');

    const missing = setup();
    missing.guild.members.fetch.mockRejectedValue(new Error('Unknown Member'));
    await run('moodle');

    setup();
    mocks.profile.mockRejectedValue(new Error('moodle down'));
    await run('moodle');
  });

  it('gives up on slow profile lookups after eight seconds', async () => {
    mocks.profile.mockReturnValue(new Promise(() => {}));
    const { member } = setup();
    const { initial } = await start();
    const pending = initial[T.moodle].fn();
    await flush();
    scheduled.find(s => s.ms === 8000)!.fn();
    await pending;
    expect(member.roles.add).not.toHaveBeenCalled();
  });

  it('pauses while the connection is known to be bad', async () => {
    setup();
    (global as unknown as { moodleConnection: unknown }).moodleConnection = {
      status: false, date: (await import('luxon')).DateTime.now(),
    };
    const { run } = await start();
    await run('moodle');
    expect(dbMock.users.findMany).not.toHaveBeenCalled();
  });
});

describe('expired bans', () => {
  const ban = (over: object = {}) => ({
    id: 'b1', target_discord_id: 'd1', guild_id: 'g1', created_at: new Date(Date.now() - 4 * 86400000), expires_at: past(), ...over,
  });

  function setup(opts: { modlog?: string | null; modThread?: string | null; unbanFails?: boolean } = {}) {
    const { guild } = makeGuild();
    const modThread = { send: vi.fn() };
    const modLog = { send: vi.fn() };
    guild.channels.fetch = vi.fn(async (id: string) => (id === 'thread' ? modThread : modLog)) as never;
    if (opts.unbanFails) guild.bans.remove.mockRejectedValue(new Error('Unknown Ban'));
    client().guilds.fetch = vi.fn(async () => guild);
    dbMock.discord_guilds.findUnique.mockResolvedValue(
      { channel_mod_log: opts.modlog === undefined ? 'log' : opts.modlog } as never,
    );
    dbMock.users.findUnique.mockResolvedValue({ mod_thread_id: opts.modThread === undefined ? 'thread' : opts.modThread } as never);
    return { guild, modThread, modLog };
  }

  it('does nothing when there are no expired bans', async () => {
    dbMock.user_actions.findMany.mockResolvedValue([]);
    const { run } = await start();
    await run('bans');
    expect(dbMock.user_actions.update).not.toHaveBeenCalled();
  });

  it('lifts the ban, reports it and clears the expiry', async () => {
    dbMock.user_actions.findMany.mockResolvedValue([ban()] as never);
    const { guild, modThread, modLog } = setup();
    const { run } = await start();
    await run('bans');
    expect(guild.bans.remove).toHaveBeenCalledWith(expect.anything(), 'Temporary ban expired');
    expect(modThread.send).toHaveBeenCalled();
    expect(modLog.send.mock.calls[0][0].embeds[0].data.description).toContain('after 3 days');
    expect(dbMock.user_actions.update).toHaveBeenCalledWith({ where: { id: 'b1' }, data: { expires_at: null } });
  });

  it('works without a mod thread, and stops early without a mod log', async () => {
    dbMock.user_actions.findMany.mockResolvedValue([ban()] as never);
    const noThread = setup({ modThread: null });
    const { run } = await start();
    await run('bans');
    expect(noThread.modLog.send).toHaveBeenCalled();

    const noLog = setup({ modlog: null });
    await run('bans');
    expect(noLog.modLog.send).not.toHaveBeenCalled();
    expect(dbMock.user_actions.update).toHaveBeenCalledTimes(2);
  });

  it('still clears the expiry when the unban fails or data is incomplete', async () => {
    dbMock.user_actions.findMany.mockResolvedValue([ban()] as never);
    setup({ unbanFails: true });
    const { run } = await start();
    await run('bans');
    expect(dbMock.user_actions.update).toHaveBeenCalledTimes(1);

    dbMock.user_actions.findMany.mockResolvedValue([ban({ created_at: null })] as never);
    setup();
    await run('bans');
    expect(dbMock.user_actions.update).toHaveBeenCalledTimes(2);

    dbMock.user_actions.findMany.mockResolvedValue([ban({ target_discord_id: null })] as never);
    await run('bans');
    expect(dbMock.user_actions.update).toHaveBeenCalledTimes(2);
  });

  it('only clears the expiry when the user or the guild can no longer be fetched', async () => {
    dbMock.user_actions.findMany.mockResolvedValue([ban()] as never);
    setup();
    const { run } = await start();
    client().users.fetch = vi.fn(async () => null) as never;
    await run('bans');
    expect(dbMock.user_actions.update).toHaveBeenCalledTimes(1);
    client().users.fetch = vi.fn(async () => ({ id: 'd1' })) as never;
    client().guilds.fetch = vi.fn(async () => null) as never;
    await run('bans');
    expect(dbMock.user_actions.update).toHaveBeenCalledTimes(2);
    expect(dbMock.discord_guilds.findUnique).not.toHaveBeenCalled();
  });
});

describe('monthly session stats', () => {
  const channelFor = (guildId: string, textBased = true) => {
    const send = vi.fn();
    client().channels.cache = new Collection([[e.CHANNEL_HELPERLOUNGE, { guildId, isTextBased: () => textBased, send }]]);
    return send;
  };

  afterEach(() => vi.useRealTimers());

  it('posts on the last day of the month only', async () => {
    mocks.stats.mockResolvedValue('stats text');
    vi.useFakeTimers({ toFake: ['Date'] });

    vi.setSystemTime(new Date(2024, 1, 29, 12));
    let send = channelFor(e.DISCORD_GUILD_ID);
    const { run } = await start();
    await run('monthly');
    expect(send).toHaveBeenCalledWith({ embeds: [expect.anything()] });

    vi.setSystemTime(new Date(2024, 1, 10, 12));
    send = channelFor(e.DISCORD_GUILD_ID);
    await run('monthly');
    expect(send).not.toHaveBeenCalled();
  });

  it('does not post in other guilds or non-text channels', async () => {
    mocks.stats.mockResolvedValue('stats');
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2024, 0, 31, 12));
    const { run } = await start();
    let send = channelFor('someone-else');
    await run('monthly');
    expect(send).not.toHaveBeenCalled();
    send = channelFor(e.DISCORD_GUILD_ID, false);
    await run('monthly');
    expect(send).not.toHaveBeenCalled();
  });
});

describe('birthdays', () => {
  const today = () => { const d = new Date(); return new Date(2000, d.getMonth(), d.getDate(), 12); };
  const user = (over: object = {}) => ({
    id: 'u', discord_id: 'd1', birthday: today(), ...over,
  });

  it('wishes members a happy birthday in the VIP lounge', async () => {
    dbMock.users.findMany.mockResolvedValue([user(), user({ discord_id: 'd2', birthday: new Date(2000, 0, 1) === today() ? null : new Date(1999, 11, 31) })] as never);
    const send = vi.fn();
    client().channels.fetch = vi.fn(async () => ({ send }));
    const { run } = await start();
    await run('birthdays');
    expect(send).toHaveBeenCalledWith('Happy Birthday, <@d1>! 🎉');
  });

  it('skips users who are missing, not in the server, or lack an id', async () => {
    dbMock.users.findMany.mockResolvedValue([user({ birthday: null }), user({ discord_id: null }), user()] as never);
    const send = vi.fn();
    client().channels.fetch = vi.fn(async () => ({ send }));
    const { guild } = makeGuild();
    guild.members.fetch = vi.fn(async () => { throw new Error('Unknown Member'); });
    client().guilds.fetch = vi.fn(async () => guild);
    const { run } = await start();
    await run('birthdays');
    expect(send).not.toHaveBeenCalled();
  });

  it('keeps going when one message fails and rethrows lookup failures', async () => {
    dbMock.users.findMany.mockResolvedValue([user()] as never);
    client().channels.fetch = vi.fn(async () => { throw new Error('Missing Access'); });
    const { run } = await start();
    await run('birthdays');

    dbMock.users.findMany.mockRejectedValue(new Error('db down'));
    const { initial } = await start();
    await expect(initial[T.birthdays].fn()).rejects.toThrow('db down');
  });
});
