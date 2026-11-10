/* eslint-disable max-len, sonarjs/no-duplicate-string, no-restricted-syntax, no-await-in-loop */
import { ChannelType } from 'discord.js';
import { dSheesh } from '../../commands/guild/d.sheesh';
import { dSay } from '../../commands/guild/d.say';
import { dTimezone } from '../../commands/guild/d.timezone';
import { dClearchat } from '../../commands/guild/d.clearchat';
import { selfTimeout } from '../../commands/guild/d.selftimeout';
import { dKarma } from '../../commands/guild/d.karma';
import { dIssue } from '../../commands/guild/d.issue';
import { dReport } from '../../commands/guild/d.report';
import { uReport } from '../../commands/guild/u.report';
import { mReport } from '../../commands/guild/m.report';
import { lastReply, slashStub, resolvingModal } from '../../../vitest/utils/commandStubs';
import { flushPromises } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  timezone: vi.fn(), parse: vi.fn(), user: vi.fn(), guild: vi.fn(), issue: vi.fn(), modResponse: vi.fn(),
}));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/commands/g.timezone', () => ({ timezone: mocks.timezone }));
vi.mock('../../../global/utils/parseDuration', () => ({ parseDuration: mocks.parse }));
vi.mock('../../../global/utils/dbRecords', () => ({ getOrCreateUser: mocks.user, getOrCreateGuild: mocks.guild }));
vi.mock('../../../global/commands/g.issue', () => ({ issue: mocks.issue }));
vi.mock('../../utils/modUtils', () => ({ modResponse: mocks.modResponse }));

const content = (s: ReturnType<typeof slashStub>) => lastReply(s).content;
const title = (s: ReturnType<typeof slashStub>) => (lastReply(s).embeds as Array<{ data: { title: string } }>)[0].data.title;
const member = (id: string, name = id) => ({
  id, displayName: name, roles: { cache: new Set<string>() }, permissions: { has: () => true },
});

describe('sheesh', () => {
  const run = async (subcommand: string, target: unknown, self = member('me', 'Me')) => {
    const stub = slashStub({ subcommand, member: self, options: { user: target } });
    await dSheesh.execute(stub as never);
    return content(stub) as string;
  };

  it('lightjoint variants', async () => {
    const me = member('me', 'Me');
    expect(await run('lightjoint', me, me)).toContain('alone');
    expect(await run('lightjoint', member('977945272359452713', 'TripBot'))).toContain('blaze it');
    expect(await run('lightjoint', member('x', 'Pal'))).toContain('sheeshin with Pal');
    expect(await run('lightjoint', null)).toContain('lighted up a joint');
  });

  it('passjoint variants', async () => {
    const me = member('me', 'Me');
    expect(await run('passjoint', me, me)).toContain('keep joint');
    expect(await run('passjoint', member('977945272359452713'))).toContain('TripBot');
    expect(await run('passjoint', member('x', 'Pal'))).toContain('passed joint to Pal');
  });
});

describe('say', () => {
  const text = () => ({
    type: ChannelType.GuildText, name: 'gen', sendTyping: vi.fn(), send: vi.fn(),
  });
  const guildWith = (botlog: unknown) => ({ id: 'g', channels: { fetch: vi.fn(async () => botlog) } });

  it('requires a guild, member and channel', async () => {
    expect(await dSay.execute(slashStub({ guild: null, options: { say: 'hi' } }) as never)).toBe(false);
    expect(await dSay.execute(slashStub({ member: null, options: { say: 'hi' } }) as never)).toBe(false);
    const noChan = slashStub({ channel: null, options: { say: 'hi' } });
    expect(await dSay.execute(noChan as never)).toBe(false);
    expect(content(noChan)).toBe('Channel not found!');
  });

  it('restricts announcement channels to moderators and rejects other types', async () => {
    const announce = slashStub({ options: { say: 'hi', channel: { type: ChannelType.GuildAnnouncement } } });
    expect(await dSay.execute(announce as never)).toBe(false);
    expect(content(announce)).toContain('Only moderators');
    const dm = slashStub({ options: { say: 'hi', channel: { type: ChannelType.DM } } });
    expect(await dSay.execute(dm as never)).toBe(false);
  });

  it('speaks after a delay and logs it', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    try {
      const chan = text();
      const botlog = { send: vi.fn() };
      const stub = slashStub({ guild: guildWith(botlog), options: { say: 'hello', channel: chan } });
      expect(await dSay.execute(stub as never)).toBe(true);
      expect(chan.sendTyping).toHaveBeenCalled();
      expect(chan.send).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(3000);
      expect(chan.send).toHaveBeenCalledWith(expect.objectContaining({ content: 'hello' }));
      expect(botlog.send).toHaveBeenCalled();
      // no bot log channel
      const quiet = slashStub({ guild: guildWith(null), options: { say: 'x', channel: text() } });
      expect(await dSay.execute(quiet as never)).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('defaults to the current channel', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    try {
      const chan = text();
      const stub = slashStub({ guild: guildWith(null), channel: chan, options: { say: 'x' } });
      expect(await dSay.execute(stub as never)).toBe(true);
      await vi.advanceTimersByTimeAsync(3000);
      expect(chan.send).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('timezone', () => {
  const run = async (subcommand: string | null, response: unknown, options: Record<string, unknown> = {}) => {
    mocks.timezone.mockResolvedValueOnce(response);
    const stub = slashStub({ subcommand, options });
    await dTimezone.execute(stub as never);
    return stub;
  };

  it('get covers every response shape', async () => {
    expect(title(await run('get', '', { user: member('t', 'Tee') }))).toContain('timeless');
    expect(title(await run('get', 'invalid'))).toContain('Invalid timezone');
    expect(title(await run('get', 'updated', { timezone: 'UTC' }))).toContain('updated your timezone to UTC');
    expect(title(await run('get', '12:00', { user: member('t', 'Tee'), ephemeral: true }))).toBe('12:00 wherever Tee is located');
  });

  it('looks up the caller by default and sets ephemerally', async () => {
    const s = await run('get', '9am');
    expect(mocks.timezone).toHaveBeenLastCalledWith('get', 'u1', null);
    expect(title(s)).toContain('9am');
    const set = await run('set', 'Set!', { timezone: 'UTC' });
    expect(content(set)).toBe('Set!');
    expect(set.deferReply).toHaveBeenCalledWith({ flags: expect.anything() });
  });
});

describe('clear-chat', () => {
  const channel = () => ({
    bulkDelete: vi.fn(),
    threads: {
      fetch: vi.fn(async () => ({ threads: new Map([['a', { delete: vi.fn() }]]) })),
      fetchArchived: vi.fn(async () => ({ threads: new Map([['b', { delete: vi.fn() }]]) })),
    },
  });
  const run = async (options: Record<string, unknown>, chan: unknown = channel()) => {
    const stub = slashStub({ options, channel: chan });
    stub.editReply.mockResolvedValue({ delete: vi.fn() });
    const result = await dClearchat.execute(stub as never);
    await flushPromises();
    return { stub, result, chan: chan as ReturnType<typeof channel> };
  };

  it('needs a channel', async () => {
    const { result } = await run({}, null);
    expect(result).toBe(false);
  });

  it('bulk deletes, with optional thread cleanup', async () => {
    const plain = await run({});
    expect(plain.chan.bulkDelete).toHaveBeenCalledWith(99, true);
    expect(plain.chan.threads.fetch).not.toHaveBeenCalled();
    const all = await run({ count: 10, 'delete-threads': true, 'delete-archived-threads': true });
    expect(all.chan.bulkDelete).toHaveBeenCalledWith(10, true);
    expect(all.chan.threads.fetch).toHaveBeenCalled();
    expect(all.chan.threads.fetchArchived).toHaveBeenCalled();
  });
});

describe('selftimeout', () => {
  it('needs a guild and confirmation', async () => {
    expect(await selfTimeout.execute(slashStub({ guild: null }) as never)).toBe(false);
    const no = slashStub({ options: { confirmation: 'no', duration: '1h' } });
    expect(await selfTimeout.execute(no as never)).toBe(false);
    expect(content(no)).toContain('try again');
  });

  it('times out the member and logs it', async () => {
    mocks.parse.mockResolvedValue(3600000);
    const modLog = { send: vi.fn() };
    const client = { guilds: { fetch: vi.fn(async () => ({ channels: { fetch: vi.fn(async () => modLog) } })) } };
    const timeout = vi.fn();
    const stub = slashStub({ client, member: { ...member('me'), timeout, user: { tag: 'me#0' } }, options: { confirmation: 'yes', duration: '1h' } });
    expect(await selfTimeout.execute(stub as never)).toBe(true);
    expect(timeout).toHaveBeenCalledWith(3600000, 'Self timeout');
    expect(modLog.send).toHaveBeenCalledWith(expect.stringContaining('me#0'));
  });
});

describe('karma', () => {
  it('shows karma for the target or self', async () => {
    mocks.user.mockResolvedValue({ karma_received: 5, karma_given: 2 });
    const other = slashStub({ options: { target: member('t', 'Tee'), ephemeral: true } });
    await dKarma.execute(other as never);
    expect(title(other)).toBe('Tee has received 5 karma and given 2 karma');
    const self = slashStub();
    await dKarma.execute(self as never);
    expect(mocks.user).toHaveBeenLastCalledWith('u1');
  });
});

describe('issue', () => {
  const submit = (id: string, over: Record<string, unknown> = {}) => ({
    customId: id,
    deferReply: vi.fn(),
    editReply: vi.fn(),
    member: { displayName: 'M' },
    guild: 'G',
    fields: { getTextInputValue: vi.fn((k: string) => k) },
    ...over,
  });

  it('opens a modal and files the issue', async () => {
    mocks.issue.mockResolvedValue({ data: { number: 9, html_url: 'https://gh/9' } });
    const modal = submit('issueModal~int1');
    const stub = slashStub({ options: { type: 'Bug' } });
    stub.awaitModalSubmit.mockImplementationOnce(resolvingModal(modal));
    expect(await dIssue.execute(stub as never)).toBe(false);
    await flushPromises();
    expect(stub.showModal).toHaveBeenCalled();
    expect(mocks.issue).toHaveBeenCalledWith('issueTitle', expect.stringContaining('submitted by M'), ['Bug', 'null', 'null', 'S0: Review Needed']);
    expect(modal.editReply).toHaveBeenCalled();
  });

  it('ignores modals for other interactions', async () => {
    const modal = submit('issueModal~other');
    const stub = slashStub();
    stub.awaitModalSubmit.mockImplementationOnce(resolvingModal(modal));
    await dIssue.execute(stub as never);
    await flushPromises();
    expect(modal.deferReply).not.toHaveBeenCalled();
  });
});

describe.each([
  ['report', dReport, { options: { target: 'x' } }],
  ['user report', uReport, {}],
  ['message report', mReport, {}],
])('%s', (_n, cmd, base) => {
  beforeEach(() => {
    mocks.modResponse.mockResolvedValue({ content: 'modal' });
    mocks.guild.mockResolvedValue({ role_moderator: 'mod', channel_mod_log: 'l', channel_moderators: 'm' });
  });

  it('ignores DMs', async () => {
    expect(await cmd.execute(slashStub({ ...base, guild: null }) as never)).toBe(false);
  });

  it('delegates to modResponse with the mod flag', async () => {
    const plain = slashStub(base);
    expect(await cmd.execute(plain as never)).toBe(true);
    expect(mocks.modResponse).toHaveBeenLastCalledWith(plain, 'REPORT', false);
    const mod = slashStub({ ...base, member: { ...member('m'), roles: { cache: new Set(['mod']) } } });
    await cmd.execute(mod as never);
    expect(mocks.modResponse).toHaveBeenLastCalledWith(mod, 'REPORT', true);
  });
});

describe('report setup check', () => {
  it('refuses when moderation is not configured', async () => {
    mocks.guild.mockResolvedValue({});
    const stub = slashStub({ options: { target: 'x' } });
    expect(await dReport.execute(stub as never)).toBe(false);
    expect(stub.editReply).toHaveBeenCalledWith(expect.stringContaining('not been set up'));
  });
});
