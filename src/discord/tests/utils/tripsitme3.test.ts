import { resolvingModal } from '../../../vitest/utils/commandStubs';
/* eslint-disable sonarjs/no-duplicate-string */
import { reopenTicket, tripSitMe, tripsitmeButton } from '../../utils/tripsitme';
import { dbMock } from '../../../vitest/utils/mockDb';
import { collectionOf, flushPromises } from '../../../vitest/utils/discordStubs';

const e = env as unknown as Record<string, string>;

const mocks = vi.hoisted(() => ({
  ensure: vi.fn(), guildOnly: vi.fn(), context: vi.fn(), setName: vi.fn(), getOpenTicket: vi.fn(), cooldown: vi.fn(), expiry: vi.fn(),
}));

vi.mock('../../utils/checkPermissions', async importOriginal => ({ ...(await importOriginal<object>()), ensurePermissions: mocks.ensure }));
vi.mock('../../utils/guildOnly', () => ({ replyGuildOnly: mocks.guildOnly }));
vi.mock('../../utils/context', () => ({ default: mocks.context }));
vi.mock('../../utils/commandCooldown', () => ({ default: mocks.cooldown }));
vi.mock('../../utils/ticketIcons', async importOriginal => ({ ...(await importOriginal<object>()), setTicketChannelName: mocks.setName }));
vi.mock('../../../global/utils/tickets', () => ({ getOpenTicket: mocks.getOpenTicket, ticketExpiryDates: mocks.expiry }));

const expiry = { archivedAt: new Date('2030-01-01'), deletedAt: new Date('2030-02-01') };
const role = (id: string, name = `role-${id}`) => ({
  id, name, comparePositionTo: () => -1, toString: (): string => `@${name}`,
});

beforeEach(() => {
  mocks.ensure.mockReset();
  mocks.ensure.mockResolvedValue(true);
  mocks.context.mockResolvedValue('ctx');
  mocks.cooldown.mockResolvedValue({ success: true });
  mocks.expiry.mockReturnValue(expiry);
  mocks.setName.mockReset();
  dbMock.users.upsert.mockResolvedValue({ id: 'uid', roles: null } as never);
});

const guildRow = (over: Record<string, unknown> = {}) => dbMock.discord_guilds.upsert.mockResolvedValue({
  id: 'g1', channel_tripsit: 'ts-chan', channel_tripsitmeta: 'meta', role_tripsitter: 'ts', role_helper: 'hp', role_needshelp: null, ...over,
} as never);

describe('tripSitMe', () => {
  function setup(opts: { metaFails?: boolean; guild?: boolean; member?: boolean; tripsitChannel?: 'ok' | 'fail' | 'unset'; teamMember?: boolean; pinFails?: boolean; cooldown?: boolean; memberInput?: boolean } = {}) {
    const owner = { send: vi.fn() };
    const message = { pin: opts.pinFails ? vi.fn().mockRejectedValue(new Error('Missing Permissions')) : vi.fn() };
    const thread = {
      id: 'thread1', name: 'thread', send: vi.fn(async () => message), toString: (): string => '<#thread1>',
    };
    const metaSend = vi.fn();
    const tripsit = { id: 'ts-chan', threads: { create: vi.fn(async () => thread) } };
    const target = {
      id: 'm1',
      displayName: 'Ally',
      toString: (): string => '<@m1>',
      fetch: vi.fn(),
      guild: { id: 'g1' },
      roles: { cache: collectionOf(opts.teamMember ? { [e.ROLE_MODERATOR]: { id: e.ROLE_MODERATOR, name: 'Moderator' } } : { x: { id: 'x', name: 'x' } }), add: vi.fn(), remove: vi.fn() },
    };
    const interaction = {
      customId: 'tripsitmeSubmit~1',
      editReply: vi.fn(),
      user: { id: 'u' },
      client: { user: { id: 'bot' } },
      member: opts.member === false ? null : target,
      guild: opts.guild === false ? null : {
        id: 'g1',
        name: 'Guild',
        toString: (): string => 'Guild',
        fetchOwner: vi.fn(async () => owner),
        roles: { fetch: vi.fn(async (id: string) => role(id)) },
        members: { fetch: vi.fn(async () => ({ roles: { highest: role('bot') } })) },
        channels: {
          fetch: vi.fn(async (id: string) => {
            if (id === 'ts-chan') { if (opts.tripsitChannel === 'fail') throw new Error('Unknown Channel'); return tripsit; }
            if (opts.metaFails) throw new Error('Unknown Channel');
            return { id: 'meta', name: 'meta', send: metaSend };
          }),
        },
      },
    };
    mocks.cooldown.mockResolvedValue(opts.cooldown === false ? { success: false, message: 'cooling down' } : { success: true });
    guildRow(opts.tripsitChannel === 'unset' ? { channel_tripsit: null } : {});
    return {
      interaction: interaction as never, raw: interaction, target: target as never, thread, metaSend, owner, tripsit,
    };
  }

  it('requires a guild and member', async () => {
    const dm = setup({ guild: false });
    expect(await tripSitMe(dm.interaction, null, 'x', 'y')).toBeNull();
    expect(mocks.guildOnly).toHaveBeenCalled();
    const noMember = setup({ member: false });
    expect(await tripSitMe(noMember.interaction, null, 'x', 'y')).toBeNull();
    expect(noMember.raw.editReply).toHaveBeenCalledWith('This must be performed by a member of a guild!');
  });

  it('tells the user when no tripsit channel is set up, clearing a stale one', async () => {
    const unset = setup({ tripsitChannel: 'unset' });
    expect(await tripSitMe(unset.interaction, unset.target, 'x', 'y')).toBeNull();
    expect(unset.raw.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('No tripsit channel found') });
    const stale = setup({ tripsitChannel: 'fail' });
    expect(await tripSitMe(stale.interaction, stale.target, 'x', 'y')).toBeNull();
    expect(dbMock.discord_guilds.update).toHaveBeenCalledWith({ where: { id: 'g1' }, data: { channel_tripsit: null } });
  });

  it('forgets a deleted meta channel while opening a ticket', async () => {
    const s = setup({ metaFails: true });
    // The cleared setting is saved, but the code carries on with an empty channel object and fails when it posts to it.
    await expect(tripSitMe(s.interaction, s.target, 'x', 'y')).rejects.toThrow(TypeError);
    expect(dbMock.discord_guilds.update).toHaveBeenCalledWith({ where: { id: 'g1' }, data: { channel_tripsitmeta: null } });
  });

  it('opens a private ticket thread, pings the team, and records the ticket', async () => {
    const s = setup();
    const result = await tripSitMe(s.interaction, s.target, 'LSD 100ug', 'feeling anxious');
    expect(result).toBe(s.thread);
    const [options] = s.tripsit.threads.create.mock.calls[0] as unknown as [{ invitable: boolean; name: string }];
    expect(options.invitable).toBe(false);
    expect(options.name).toContain("Ally's channel!");
    const [{ content }] = s.thread.send.mock.calls[0] as unknown as [{ content: string }];
    expect(content).toContain('LSD 100ug');
    expect(content).toContain('feeling anxious');
    expect(content).toContain('and/or @role-hp');
    expect(content).toContain('medical emergency');
    expect(s.metaSend).toHaveBeenCalledWith(expect.objectContaining({ embeds: [expect.anything()] }));
    expect(dbMock.user_tickets.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        thread_id: 'thread1', type: 'TRIPSIT', status: 'OPEN', archived_at: expiry.archivedAt,
      }),
    });
  });

  it('handles missing details, team members and the interaction member as default target', async () => {
    const s = setup({ teamMember: true });
    await tripSitMe(s.interaction, null, '', '');
    const [{ content }] = s.thread.send.mock.calls[0] as unknown as [{ content: string }];
    expect(content).toContain('*No info given*');
    expect(content).not.toContain('and/or');
    expect((dbMock.user_tickets.create.mock.calls[0][0] as { data: { description: string } }).data.description).toContain('No info given');
  });

  it('warns the owner when the intro message cannot be pinned, and surfaces cooldown messages', async () => {
    const s = setup({ pinFails: true, cooldown: false });
    await tripSitMe(s.interaction, s.target, 'x', 'y');
    expect(s.owner.send).toHaveBeenCalledWith({ content: expect.stringContaining('error pinning') });
    expect(s.raw.editReply).toHaveBeenCalledWith('cooling down');
  });
});

describe('reopenTicket', () => {
  const baseTicket = (over: Record<string, unknown> = {}) => ({
    id: 't1', created_at: new Date(Date.now() - 3_600_000), reopened_at: null, meta_thread_id: null, ...over,
  });

  function setup(opts: { metaFetch?: 'ok' | 'fail' } = {}) {
    const thread = { send: vi.fn() };
    const metaThread = { send: vi.fn() };
    const interaction = {
      guild: {
        roles: { fetch: vi.fn(async (id: string) => role(id)) },
        channels: { fetch: vi.fn(async () => { if (opts.metaFetch === 'fail') throw new Error('Unknown Channel'); return metaThread; }) },
      },
    };
    const target = { id: 'm1', displayName: 'Ally', toString: (): string => '<@m1>' };
    return {
      interaction, target, thread, metaThread,
    };
  }
  const run = (s: ReturnType<typeof setup>, ticket: unknown, extra: Record<string, unknown> = {}, guild: Record<string, unknown> = {}) => reopenTicket({
    interaction: s.interaction as never,
    target: s.target as never,
    guildData: {
      id: 'g1', role_tripsitter: 'ts', role_helper: 'hp', ...guild,
    } as never,
    ticketData: ticket as never,
    threadHelpUser: s.thread as never,
    helpMessage: 'Welcome back',
    metaSubject: 'they need help',
    ...extra,
  });

  it('adds the team ping when the ticket has been quiet for a while', async () => {
    const s = setup();
    await run(s, baseTicket());
    const [{ content }] = s.thread.send.mock.calls[0] as unknown as [{ content: string }];
    expect(content).toContain('Someone from the @role-ts and/or @role-hp team');
    expect(mocks.setName).toHaveBeenCalledWith(s.thread, expect.stringContaining("Ally's channel!"));
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith({
      where: { id: 't1' }, data: expect.objectContaining({ status: 'OPEN', archived_at: expiry.archivedAt }),
    });
  });

  it('skips the team ping for recent tickets, and marks team reopens as owned', async () => {
    const s = setup();
    await run(s, baseTicket({ reopened_at: new Date() }), { status: 'OWNED' });
    expect((s.thread.send.mock.calls[0][0] as { content: string }).content).toBe('Welcome back');
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'OWNED' }) }));
  });

  it('works without helper or tripsitter roles configured', async () => {
    const s = setup();
    await run(s, baseTicket(), {}, { role_tripsitter: null, role_helper: null });
    expect((s.thread.send.mock.calls[0][0] as { content: string }).content).toContain('team will be with you');
  });

  it('notifies the meta thread, and forgets it when it was deleted', async () => {
    const s = setup();
    await run(s, baseTicket({ meta_thread_id: 'mt' }));
    expect((s.metaThread.send.mock.calls[0][0] as { content: string }).content).toContain('Hey @role-ts and/or @role-hp team, they need help');
    const recent = setup();
    await run(recent, baseTicket({ meta_thread_id: 'mt', reopened_at: new Date() }));
    expect((recent.metaThread.send.mock.calls[0][0] as { content: string }).content).toBe('they need help');
    const gone = setup({ metaFetch: 'fail' });
    await run(gone, baseTicket({ meta_thread_id: 'mt' }));
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { meta_thread_id: null } });
    const noHelper = setup();
    await run(noHelper, baseTicket({ meta_thread_id: 'mt' }), {}, { role_helper: null });
    expect((noHelper.metaThread.send.mock.calls[0][0] as { content: string }).content).not.toContain('/or');
  });
});

describe('tripsitmeButton', () => {
  function setup(opts: { cooldown?: boolean; tripsit?: 'ok' | 'fail' | 'unset'; meta?: 'ok' | 'fail' | 'unset'; ticket?: 'none' | 'open' | 'deleted-thread'; submitId?: string; submitFails?: boolean } = {}) {
    const thread = {
      id: 'thread1', name: 'thread', send: vi.fn(async () => ({ pin: vi.fn() })), toString: (): string => '<#thread1>',
    };
    const tripsit = { id: 'ts-chan', name: 'tripsit', threads: { create: vi.fn(async () => thread) } };
    const meta = { id: 'meta', name: 'meta', send: vi.fn() };
    const existingThread = {
      id: 'old-thread', name: 'old', toString: (): string => '<#old>', send: vi.fn(),
    };
    const target = {
      id: 'm1',
      displayName: 'Ally',
      toString: (): string => '<@m1>',
      fetch: vi.fn(),
      guild: { id: 'g1' },
      roles: { cache: collectionOf({}), add: vi.fn(), remove: vi.fn() },
    };
    const submit = {
      customId: `tripsitmeSubmit~${opts.submitId ?? 'int1'}`,
      deferReply: vi.fn(),
      user: { id: 'u' },
      client: { user: { id: 'bot' } },
      member: target,
      editReply: opts.submitFails ? vi.fn().mockRejectedValue(new Error('gone')) : vi.fn(),
      fields: { getTextInputValue: vi.fn((k: string) => `${k}!`) },
      guild: null as unknown,
    };
    const guild = {
      id: 'g1',
      name: 'Guild',
      toString: (): string => 'Guild',
      fetchOwner: vi.fn(async () => ({ send: vi.fn() })),
      roles: { fetch: vi.fn(async (id: string) => role(id)) },
      members: { fetch: vi.fn(async () => ({ roles: { highest: role('bot') } })) },
      channels: {
        fetch: vi.fn(async (id: string) => {
          if (id === 'ts-chan') { if (opts.tripsit === 'fail') throw new Error('Unknown'); return tripsit; }
          if (id === 'meta') { if (opts.meta === 'fail') throw new Error('Unknown'); return meta; }
          if (id === 'old-thread') { if (opts.ticket === 'deleted-thread') throw new Error('Unknown'); return existingThread; }
          return thread;
        }),
      },
    };
    submit.guild = guild;
    const interaction = {
      id: 'int1',
      customId: 'tripsitmeClick',
      user: { id: 'u' },
      client: { user: { id: 'bot' } },
      member: target,
      guild,
      deferReply: vi.fn(),
      editReply: vi.fn(),
      reply: vi.fn(),
      showModal: vi.fn(),
      awaitModalSubmit: vi.fn(resolvingModal(submit)),
    };
    mocks.cooldown.mockResolvedValue(opts.cooldown === false ? { success: false, message: 'wait' } : { success: true });
    guildRow({ channel_tripsit: opts.tripsit === 'unset' ? null : 'ts-chan', channel_tripsitmeta: opts.meta === 'unset' ? null : 'meta' });
    dbMock.user_tickets.findFirst.mockResolvedValue((opts.ticket === 'open' || opts.ticket === 'deleted-thread'
      ? {
        id: 't1', thread_id: 'old-thread', meta_thread_id: null, created_at: new Date(Date.now() - 3_600_000), reopened_at: null, archived_at: null, deleted_at: null,
      }
      : null) as never);
    return {
      interaction: interaction as never, raw: interaction, submit, thread, existingThread, tripsit, meta,
    };
  }

  it('enforces the cooldown', async () => {
    const s = setup({ cooldown: false });
    await tripsitmeButton(s.interaction);
    expect(s.raw.reply).toHaveBeenCalledWith({ content: 'wait', flags: 64 });
    expect(s.raw.showModal).not.toHaveBeenCalled();
  });

  it('stops when channel permissions are missing', async () => {
    mocks.ensure.mockImplementationOnce(async (_c: unknown, _p: unknown, _f: unknown, o: { ownerMessage: () => unknown }) => { o.ownerMessage(); return false; });
    const first = setup();
    await tripsitmeButton(first.interaction);
    expect(first.raw.showModal).not.toHaveBeenCalled();
    mocks.ensure.mockResolvedValueOnce(true).mockImplementationOnce(async (_c: unknown, _p: unknown, _f: unknown, o: { ownerMessage: () => unknown }) => { o.ownerMessage(); return false; });
    const second = setup();
    await tripsitmeButton(second.interaction);
    expect(second.raw.showModal).not.toHaveBeenCalled();
  });

  it('clears stale tripsit and meta channel settings', async () => {
    const stale = setup({ tripsit: 'fail', meta: 'fail' });
    await tripsitmeButton(stale.interaction);
    expect(dbMock.discord_guilds.update).toHaveBeenCalledWith({ where: { id: 'g1' }, data: { channel_tripsit: null } });
    expect(dbMock.discord_guilds.update).toHaveBeenCalledWith({ where: { id: 'g1' }, data: { channel_tripsitmeta: null } });
  });

  it('collects triage details in a modal and creates the ticket', async () => {
    const s = setup();
    await tripsitmeButton(s.interaction);
    await flushPromises();
    expect(s.raw.showModal).toHaveBeenCalled();
    expect(s.submit.deferReply).toHaveBeenCalled();
    expect(s.tripsit.threads.create).toHaveBeenCalled();
    expect(JSON.stringify(s.submit.editReply.mock.calls.at(-1)?.[0])).toContain('Click here to be taken to your private room');
  });

  it('ignores other users\' modals, reports creation failures, and survives reply errors', async () => {
    const other = setup({ submitId: 'else' });
    await tripsitmeButton(other.interaction);
    await flushPromises();
    expect(other.submit.deferReply).not.toHaveBeenCalled();
    const broken = setup({ tripsit: 'unset' });
    await tripsitmeButton(broken.interaction);
    await flushPromises();
    expect(JSON.stringify(broken.submit.editReply.mock.calls.at(-1)?.[0])).toContain('there was an error creating your help thread');
    const replyFails = setup({ submitFails: true });
    await tripsitmeButton(replyFails.interaction);
    await flushPromises();
    expect(replyFails.submit.editReply).toHaveBeenCalled();
  });

  it('reopens an existing ticket instead of creating a new one', async () => {
    const s = setup({ ticket: 'open' });
    await tripsitmeButton(s.interaction);
    expect(s.raw.deferReply).toHaveBeenCalled();
    expect(JSON.stringify(s.raw.editReply.mock.calls[0][0])).toContain('you have an open session');
    expect(s.existingThread.send).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('continue talking here') }));
    expect(s.raw.showModal).not.toHaveBeenCalled();
  });

  it('marks tickets with deleted threads deleted, then starts a fresh request', async () => {
    const s = setup({ ticket: 'deleted-thread' });
    await tripsitmeButton(s.interaction);
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: expect.objectContaining({ status: 'DELETED' }) });
    expect(s.raw.showModal).toHaveBeenCalled();
    await flushPromises();
  });
});
