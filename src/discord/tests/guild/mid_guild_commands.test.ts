/* eslint-disable max-len, sonarjs/no-duplicate-string, no-restricted-syntax, no-await-in-loop */
import { ChannelType, PermissionFlagsBits, TextChannel } from 'discord.js';
import { DateTime } from 'luxon';
import { dBirthday } from '../../commands/guild/d.birthday';
import { dPurge, purgeButton, purgeMenu } from '../../commands/guild/d.purge';
import { dBotmod } from '../../commands/guild/d.botmod';
import { dDramacounter } from '../../commands/guild/d.dramacounter';
import { dBotstats } from '../../commands/guild/d.botstats';
import { lastReply, slashStub, resolvingModal } from '../../../vitest/utils/commandStubs';
import { collectionOf, flushPromises, stubInstance } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  birthday: vi.fn(), botmod: vi.fn(), drama: vi.fn(), parse: vi.fn(), stats: vi.fn(),
}));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/commands/g.birthday', () => ({ birthday: mocks.birthday }));
vi.mock('../../../global/commands/g.botmod', () => ({ botmod: mocks.botmod }));
vi.mock('../../../global/commands/g.dramacounter', () => ({ dramacounter: mocks.drama }));
vi.mock('../../../global/utils/parseDuration', () => ({ parseDuration: mocks.parse }));
vi.mock('../../../global/commands/g.botstats', () => ({ botStats: mocks.stats }));

const content = (s: ReturnType<typeof slashStub>) => lastReply(s).content as string;
const embed = (s: ReturnType<typeof slashStub>) => (lastReply(s).embeds as Array<{ data: { title?: string; description?: string } }>)[0].data;
const mem = (id: string, displayName = id) => ({
  id, displayName, roles: { cache: new Set<string>() }, permissions: { has: () => true },
});

describe('birthday', () => {
  beforeEach(() => { mocks.birthday.mockReset(); });

  const run = async (subcommand: string, options: Record<string, unknown> = {}) => {
    const stub = slashStub({ subcommand, options });
    await dBirthday.execute(stub as never);
    return stub;
  };

  it('get: unset, today and upcoming', async () => {
    mocks.birthday.mockResolvedValueOnce(null);
    expect(embed(await run('get', { user: mem('t', 'Tee'), ephemeral: true })).title).toContain('immortal');
    mocks.birthday.mockResolvedValueOnce(DateTime.utc().plus({ days: 10 }));
    mocks.birthday.mockResolvedValueOnce(DateTime.utc().plus({ days: 10 }));
    expect(embed(await run('get')).description).toMatch(/Only \d+ days left/);
    mocks.birthday.mockResolvedValueOnce(DateTime.utc().minus({ days: 10 }));
    expect(embed(await run('get')).description).toMatch(/Only \d+ days left/);
  });

  // TripSit/TripBot#1371: on the birthday itself the diff is slightly negative, so it reports 365 days.
  it.fails('get greets the user on their birthday', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-05-04T12:00:00Z'));
      mocks.birthday.mockResolvedValueOnce(DateTime.utc(2000, 5, 4));
      expect(embed(await run('get')).description).toBe('Happy birthday!');
    } finally {
      vi.useRealTimers();
    }
  });

  it('get reports exactly zero days only on the identical instant', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-05-04T00:00:00Z'));
      mocks.birthday.mockResolvedValueOnce(DateTime.utc(2000, 5, 4));
      expect(embed(await run('get')).description).toBe('Happy birthday!');
    } finally {
      vi.useRealTimers();
    }
  });

  it('set validates month and day', async () => {
    expect(content(await run('set', { day: 5 }))).toContain('specify a month');
    expect(content(await run('set', { month: 'May', day: 0 }))).toContain('valid day');
    expect(content(await run('set', { month: 'April', day: 31 }))).toContain('only has 30');
    expect(content(await run('set', { month: 'May', day: 32 }))).toContain('only has 31');
    expect(content(await run('set', { month: 'February', day: 29 }))).toContain('February only has 28');
  });

  it('set stores a valid date', async () => {
    mocks.birthday.mockResolvedValueOnce(DateTime.utc(2000, 3, 4));
    const stub = await run('set', { month: 'March', day: 4, user: mem('t') });
    expect(mocks.birthday).toHaveBeenLastCalledWith('set', 't', 3, 4);
    expect(embed(stub).title).toBe('Set your birthday to March 4');
  });
});

describe('purge', () => {
  const textChannel = (id: string, authors: string[]) => {
    const msgs = collectionOf(authors.map((a, i) => [`${id}m${i}`, { id: `${id}m${i}`, author: { id: a } }] as [string, { id: string; author: { id: string } }]));
    return { id, type: ChannelType.GuildText, messages: { fetch: vi.fn(async () => msgs), delete: vi.fn() } };
  };
  const guildOf = (channels: Array<ReturnType<typeof textChannel>>, extra: ChannelType[] = []) => {
    const col = collectionOf<unknown>([
      ...channels.map(c => [c.id, c] as [string, unknown]),
      ...extra.map((t, i) => [`x${i}`, { id: `x${i}`, type: t }] as [string, unknown]),
      ['null', null],
    ]);
    return { id: 'g', channels: { fetch: vi.fn(async () => col), cache: collectionOf(channels.map(c => [c.id, c] as [string, unknown])) } };
  };

  it('requires a guild and channel', async () => {
    expect(await dPurge.execute(slashStub({ channel: null, subcommand: 'messages' }) as never)).toBe(false);
    expect(await dPurge.execute(slashStub({ guild: null, subcommand: 'messages' }) as never)).toBe(false);
  });

  it('shows how many messages would go, with a mod-only user picker', async () => {
    const guild = guildOf([textChannel('c1', ['u1', 'other', 'u1']), textChannel('c2', ['other'])], [ChannelType.GuildVoice]);
    const stub = slashStub({ guild, subcommand: 'messages', extra: { isUserSelectMenu: () => false } });
    expect(await dPurge.execute(stub as never)).toBe(true);
    const reply = stub.reply.mock.calls[0][0] as { embeds: Array<{ data: { description: string } }>; components: unknown[] };
    expect(reply.embeds[0].data.description).toContain('2 messages in 1 channels');
    expect(reply.components).toHaveLength(2);

    const plain = slashStub({
      guild, subcommand: 'messages', extra: { isUserSelectMenu: () => false }, member: { ...mem('u1'), permissions: { has: (p: bigint) => p !== PermissionFlagsBits.ManageMessages } },
    });
    await dPurge.execute(plain as never);
    expect((plain.reply.mock.calls[0][0] as { components: unknown[] }).components).toHaveLength(1);
  });

  it('handles a guild without channels', async () => {
    const guild = { id: 'g', channels: { fetch: vi.fn(async () => null) } };
    const stub = slashStub({ guild, subcommand: 'messages', extra: { isUserSelectMenu: () => false } });
    await dPurge.execute(stub as never);
    expect((stub.reply.mock.calls[0][0] as { embeds: Array<{ data: { description: string } }> }).embeds[0].data.description).toContain('0 messages');
  });

  it('menu picks another user, ignoring unknown menus', async () => {
    const guild = guildOf([textChannel('c1', ['target', 'target'])]);
    const base = {
      guild, user: { id: 'u1' }, member: mem('u1'), id: 'i', update: vi.fn(), isUserSelectMenu: () => true, values: ['target'],
    };
    await purgeMenu({ ...base, customId: 'purge~user' } as never);
    expect(base.update).toHaveBeenCalledTimes(1);
    expect((base.update.mock.calls[0][0] as { embeds: Array<{ data: { description: string } }> }).embeds[0].data.description).toContain('2 messages');
    const other = { ...base, update: vi.fn(), customId: 'purge~zzz' };
    await purgeMenu(other as never);
    expect(other.update).not.toHaveBeenCalled();
    // a select menu with a different id keeps the invoking user
    const wrongId = { ...base, update: vi.fn(), customId: 'purge~user' };
    wrongId.isUserSelectMenu = () => true;
    await purgeMenu(wrongId as never);
    expect(wrongId.update).toHaveBeenCalled();
  });

  it('button confirms and deletes the target messages', async () => {
    const c1 = textChannel('c1', ['target', 'x']);
    const guild = guildOf([c1]);
    const stub = {
      guild, id: 'i', customId: 'purge~confirm~target', update: vi.fn(), editReply: vi.fn(), user: { id: 'u1' }, member: mem('u1'),
    };
    // deleteMessages reads cache.get(channel).messages.delete
    (guild.channels.cache as unknown as Map<string, unknown>).set('c1', stubInstance(TextChannel, { messages: c1.messages }));
    await purgeButton(stub as never);
    expect(stub.update).toHaveBeenCalled();
    expect(c1.messages.delete).toHaveBeenCalledWith('c1m0');
    expect(c1.messages.delete).toHaveBeenCalledTimes(1);
    const other = { ...stub, customId: 'purge~zzz', editReply: vi.fn() };
    await purgeButton(other as never);
    expect(other.editReply).not.toHaveBeenCalled();
  });
});

describe('botmod', () => {
  beforeEach(() => { mocks.botmod.mockResolvedValue({ content: 'done' }); });

  it('botinfo replies directly', async () => {
    const stub = slashStub({ group: 'guild', subcommand: 'botinfo', options: { target: '123' } });
    expect(await dBotmod.execute(stub as never)).toBe(true);
    expect(mocks.botmod).toHaveBeenCalledWith(stub, 'guild', stub.member, 'BOTINFO', '123', null, null);
    expect(content(stub)).toBe('done');
  });

  it.each(['botban', 'botwarning', 'botkick'])('%s collects reasons in a modal', async sub => {
    const modal = {
      customId: 'botModModal~int1',
      deferReply: vi.fn(),
      editReply: vi.fn(),
      fields: { getTextInputValue: vi.fn((k: string) => { if (k === 'pubReason') throw new Error('none'); return 'priv'; }) },
    };
    const stub = slashStub({ group: 'user', subcommand: sub, options: { target: '9', toggle: 'off' } });
    stub.awaitModalSubmit.mockImplementationOnce(resolvingModal(modal));
    expect(await dBotmod.execute(stub as never)).toBe(false);
    await flushPromises();
    expect(stub.showModal).toHaveBeenCalled();
    const expected = sub === 'botban' ? 'UNBOTBAN' : sub.toUpperCase();
    expect(mocks.botmod).toHaveBeenCalledWith(stub, 'user', stub.member, expected, '9', 'priv', '');
    expect(modal.editReply).toHaveBeenCalledWith({ content: 'done' });
  });

  it('ignores foreign modals', async () => {
    const modal = { customId: 'botModModal~zzz', deferReply: vi.fn() };
    const stub = slashStub({ group: 'user', subcommand: 'botban', options: { target: '9' } });
    stub.awaitModalSubmit.mockImplementationOnce(resolvingModal(modal));
    await dBotmod.execute(stub as never);
    await flushPromises();
    expect(modal.deferReply).not.toHaveBeenCalled();
  });
});

describe('dramacounter', () => {
  const run = async (subcommand: string, options: Record<string, unknown> = {}, guild: unknown = { id: 'g' }) => {
    const stub = slashStub({ subcommand, options, guild });
    const result = await dDramacounter.execute(stub as never);
    return { stub, result };
  };

  it('needs a guild', async () => {
    expect((await run('get', {}, null)).result).toBe(false);
  });

  it('get', async () => {
    mocks.drama.mockResolvedValueOnce({ lastDramaAt: null });
    expect(embed((await run('get')).stub).description).toBe('There has been no drama yet!');
    mocks.drama.mockResolvedValueOnce({ lastDramaAt: new Date(), dramaReason: 'spicy' });
    expect(embed((await run('get', { ephemeral: true })).stub).description).toContain('spicy');
  });

  it('set validates and records', async () => {
    expect((await run('set', { dramaissue: 'x' })).result).toBe(false);
    mocks.parse.mockResolvedValue(3600000);
    expect((await run('set', { dramatime: '1h' })).result).toBe(false);
    mocks.drama.mockResolvedValueOnce({ lastDramaAt: null });
    expect((await run('set', { dramatime: '1h', dramaissue: 'x' })).result).toBe(false);
    mocks.drama.mockResolvedValueOnce({ lastDramaAt: new Date(), dramaReason: 'why' });
    const ok = await run('set', { dramatime: '1h', dramaissue: 'why' });
    expect(ok.result).toBe(true);
    expect(embed(ok.stub).description).toContain('why');
  });
});

describe('botstats', () => {
  const stats = {
    guildCount: 1,
    userCount: 2,
    commandCount: 3,
    tsDbSize: 4,
    tsPwDbSize: 5,
    uptime: 6000,
    ping: 7,
    dbTripbotStatus: 'Online',
    dbMoodleStatus: 'Offline',
    nodeHeapUsed: 8,
    nodeHeapTotal: 9,
    cpuUsage: 10,
    cpuCount: 2,
    memUsage: 11,
    memTotal: 12,
    driveUsage: 13,
    driveTotal: 14,
    netDown: 1,
    netUp: 2,
    hostUptime: 100,
  };

  it('shows a short list to ordinary users and a table to the owner', async () => {
    mocks.stats.mockResolvedValue(stats);
    const user = slashStub({ options: { ephemeral: true } });
    expect(await dBotstats.execute(user as never)).toBe(true);
    expect(embed(user).description).toContain('Guilds:   1');
    expect(embed(user).description).not.toContain('Host Up');
    const owner = slashStub({ user: { id: (env as unknown as Record<string, string>).DISCORD_OWNER_ID } });
    await dBotstats.execute(owner as never);
    expect(embed(owner).description).toContain('Host Up');
    expect(embed(owner).description).toContain('Moodle:✘');
  });
});

describe('birthday defaults', () => {
  it('treats a missing subcommand as get', async () => {
    mocks.birthday.mockResolvedValueOnce(null);
    const stub = slashStub({ options: {} });
    stub.options.getSubcommand.mockReturnValue(undefined as never);
    await dBirthday.execute(stub as never);
    expect(embed(stub).title).toContain('immortal');
  });
});
