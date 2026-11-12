/* eslint-disable sonarjs/no-duplicate-string */
import { tripsitmeTeamClose, tripsitmeUserClose } from '../../utils/tripsitme';
import { dbMock } from '../../../vitest/utils/mockDb';
import { flushPromises } from '../../../vitest/utils/discordStubs';

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

type RoleStub = { id: string; name: string; comparePositionTo: (r: unknown) => number };
const role = (id: string, name = `role-${id}`, cmp = -1): RoleStub => ({ id, name, comparePositionTo: () => cmp });
const expiry = { archivedAt: new Date('2030-01-01'), deletedAt: new Date('2030-02-01') };

beforeEach(() => {
  mocks.context.mockResolvedValue('ctx');
  mocks.cooldown.mockResolvedValue({ success: true });
  mocks.expiry.mockReturnValue(expiry);
  mocks.getOpenTicket.mockReset();
  mocks.setName.mockReset();
  dbMock.users.upsert.mockResolvedValue({ id: 'uid', roles: null } as never);
  dbMock.discord_guilds.upsert.mockResolvedValue({ id: 'g1', role_needshelp: 'nh', channel_tripsitmeta: 'meta' } as never);
  (global as unknown as { emojiGet: unknown }).emojiGet = vi.fn(() => '<:invisible:1>');
});

const ticket = (over: Record<string, unknown> = {}) => ({
  id: 't1', thread_id: 'th', meta_thread_id: null, status: 'OPEN', archived_at: null, deleted_at: null, ...over,
});

describe('tripsitmeTeamClose', () => {
  function setup(opts: { guild?: boolean; member?: boolean; channel?: boolean; targetId?: string; actorId?: string; targetFetch?: 'ok' | 'fail'; threadFetch?: 'ok' | 'fail'; archived?: boolean; metaFetch?: 'ok' | 'fail' } = {}) {
    const thread = {
      name: '🟡 ▲│Ally\'s channel!', archived: !!opts.archived, send: vi.fn(), setArchived: vi.fn(),
    };
    const metaChannel = { name: 'meta-name', send: vi.fn() };
    const interaction = {
      customId: `tripsitmeTeamClose~${opts.targetId ?? 'target'}`,
      deferReply: vi.fn(),
      editReply: vi.fn(),
      member: opts.member === false ? null : { id: opts.actorId ?? 'actor', displayName: 'Helper' },
      channel: opts.channel === false ? null : {},
      guild: opts.guild === false ? null : {
        id: 'g1',
        members: { fetch: vi.fn(async () => { if (opts.targetFetch === 'fail') throw new Error('Unknown Member'); return { displayName: 'Target', toString: (): string => '<@target>' }; }) },
        channels: {
          fetch: vi.fn(async (id: string) => {
            if (id === 'th') { if (opts.threadFetch === 'fail') throw new Error('Unknown Channel'); return thread; }
            if (opts.metaFetch === 'fail') throw new Error('Unknown Channel');
            return metaChannel;
          }),
        },
      },
    };
    return {
      interaction: interaction as never, raw: interaction, thread, metaChannel,
    };
  }

  it('ignores incomplete contexts', async () => {
    await tripsitmeTeamClose(setup({ guild: false }).interaction);
    await tripsitmeTeamClose(setup({ member: false }).interaction);
    await tripsitmeTeamClose(setup({ channel: false }).interaction);
    expect(mocks.context).not.toHaveBeenCalled();
  });

  it('hides the button from the person being helped (except the bot owner)', async () => {
    const self = setup({ targetId: 'actor', actorId: 'actor' });
    await tripsitmeTeamClose(self.interaction);
    expect(self.raw.editReply).toHaveBeenCalledWith({ content: 'You should not be able to see this button!' });
    mocks.getOpenTicket.mockResolvedValue(null);
    const owner = setup({ targetId: e.DISCORD_OWNER_ID, actorId: e.DISCORD_OWNER_ID });
    await tripsitmeTeamClose(owner.interaction);
    expect(JSON.stringify(owner.raw.editReply.mock.calls[0][0])).toContain('does not have an open session');
  });

  it('explains when there is no open session, even if the target left', async () => {
    mocks.getOpenTicket.mockResolvedValue(null);
    const s = setup({ targetFetch: 'fail' });
    await tripsitmeTeamClose(s.interaction);
    expect(JSON.stringify(s.raw.editReply.mock.calls[0][0])).toContain('this user does not have an open session');
    mocks.getOpenTicket.mockResolvedValue({});
    const empty = setup();
    await tripsitmeTeamClose(empty.interaction);
    expect(JSON.stringify(empty.raw.editReply.mock.calls[0][0])).toContain('does not have an open session');
  });

  it('prompts the user to close, marks the ticket resolved and notifies the meta channel', async () => {
    mocks.getOpenTicket.mockResolvedValue(ticket());
    const s = setup({ archived: true });
    await tripsitmeTeamClose(s.interaction);
    expect(s.thread.setArchived).toHaveBeenCalledWith(false);
    expect(s.thread.send).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining("you're doing somewhat better") }));
    expect(mocks.setName).toHaveBeenCalledWith(s.thread, expect.stringContaining('│Ally'));
    expect(s.metaChannel.send).toHaveBeenCalledWith({ content: expect.stringContaining('no longer needs help') });
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith({
      where: { id: 't1' }, data: { status: 'RESOLVED', archived_at: expiry.archivedAt, deleted_at: expiry.deletedAt },
    });
    expect(s.raw.editReply).toHaveBeenLastCalledWith({ content: 'Done!' });
    expect(mocks.setName).toHaveBeenCalledTimes(1);
  });

  it('renames per-ticket meta threads and forgets deleted ones', async () => {
    mocks.getOpenTicket.mockResolvedValue(ticket({ meta_thread_id: 'mt' }));
    const s = setup();
    await tripsitmeTeamClose(s.interaction);
    expect(mocks.setName).toHaveBeenCalledTimes(2);
    mocks.setName.mockClear();
    const gone = setup({ metaFetch: 'fail' });
    await tripsitmeTeamClose(gone.interaction);
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { meta_thread_id: null } });
  });

  it('handles tickets whose thread was deleted', async () => {
    mocks.getOpenTicket.mockResolvedValue(ticket());
    const s = setup({ threadFetch: 'fail' });
    await expect(tripsitmeTeamClose(s.interaction)).rejects.toThrow();
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: expect.objectContaining({ status: 'DELETED' }) });
  });
});

describe('tripsitmeUserClose', () => {
  type Opts = {
    guild?: boolean; member?: boolean; channel?: boolean; cooldown?: boolean; targetId?: string; actorId?: string; override?: boolean; ticket?: boolean;
    roles?: string | null; needshelp?: 'ok' | 'above' | 'fail' | 'unset'; metaChannelFetch?: 'ok' | 'fail'; threadFetch?: 'ok' | 'fail'; archived?: boolean;
    guildId?: string; metaTicket?: boolean; editReplyFails?: boolean;
  };

  function setup(opts: Opts = {}) {
    const surveyMessage = { react: vi.fn(), delete: vi.fn(), createReactionCollector: vi.fn() };
    const handlers: Record<string, (...args: unknown[]) => Promise<void>> = {};
    const collector = { on: vi.fn((event: string, fn: (...args: unknown[]) => Promise<void>) => { handlers[event] = fn; }), stop: vi.fn() };
    surveyMessage.createReactionCollector.mockReturnValue(collector);
    const thread = {
      name: 'thread', archived: !!opts.archived, setArchived: vi.fn(), send: vi.fn(async () => surveyMessage),
    };
    const metaChannel = { name: 'meta', send: vi.fn() };
    const target = {
      id: opts.targetId ?? 'actor',
      displayName: 'Target',
      toString: (): string => '<@target>',
      guild: { id: opts.guildId ?? 'g1' },
      roles: { remove: vi.fn(), add: vi.fn() },
    };
    const guildRoles = new Map<string, RoleStub>([['r1', role('r1')], ['r-above', role('r-above', 'above', 1)], ['everyone', role('everyone', '@everyone')], ['nh', role('nh', 'needshelp', opts.needshelp === 'above' ? 1 : -1)], [e.ROLE_TEAMTRIPSIT, role(e.ROLE_TEAMTRIPSIT, 'team')]]);
    const interaction = {
      customId: `${opts.override ? 'tripsitmodeOffOverride' : 'tripsitmeUserClose'}~${opts.targetId ?? 'actor'}`,
      deferReply: vi.fn(),
      editReply: opts.editReplyFails ? vi.fn().mockRejectedValue(new Error('gone')) : vi.fn(),
      reply: vi.fn(),
      user: { id: 'actor' },
      client: { user: { id: 'bot' } },
      member: opts.member === false ? null : { id: opts.actorId ?? 'actor', displayName: 'Ally', fetch: vi.fn() },
      channel: opts.channel === false ? null : {},
      guild: opts.guild === false ? null : {
        id: 'g1',
        name: 'Guild',
        members: { fetch: vi.fn(async (id: string) => (id === 'bot' ? { roles: { highest: { id: 'bot', name: 'bot', comparePositionTo: (r: { id: string }) => (r.id === 'r-above' ? -1 : 0) } } } : target)) },
        roles: { fetch: vi.fn(async (id: string) => { if (opts.needshelp === 'fail' && id === 'nh') throw new Error('Unknown Role'); return guildRoles.get(id) ?? role(id); }) },
        channels: {
          fetch: vi.fn(async (id: string) => {
            if (id === 'th') { if (opts.threadFetch === 'fail') throw new Error('Unknown Channel'); return thread; }
            if (opts.metaChannelFetch === 'fail') throw new Error('Unknown Channel');
            return metaChannel;
          }),
        },
      },
    };
    mocks.cooldown.mockResolvedValue(opts.cooldown === false ? { success: false, message: 'slow down' } : { success: true });
    mocks.getOpenTicket.mockResolvedValue(null);
    dbMock.user_tickets.findFirst.mockResolvedValue((opts.ticket === false ? null : ticket(opts.metaTicket ? { meta_thread_id: 'mt' } : {})) as never);
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', roles: opts.roles === undefined ? null : opts.roles } as never);
    dbMock.discord_guilds.upsert.mockResolvedValue({
      id: 'g1', role_needshelp: opts.needshelp === 'unset' ? null : 'nh', channel_tripsitmeta: 'meta',
    } as never);
    return {
      interaction: interaction as never, raw: interaction, thread, metaChannel, target, surveyMessage, handlers, collector,
    };
  }

  it('ignores incomplete contexts and enforces the cooldown', async () => {
    await tripsitmeUserClose(setup({ guild: false }).interaction);
    await tripsitmeUserClose(setup({ member: false }).interaction);
    await tripsitmeUserClose(setup({ channel: false }).interaction);
    const slow = setup({ cooldown: false });
    await tripsitmeUserClose(slow.interaction);
    expect(slow.raw.reply).toHaveBeenCalledWith({ content: 'slow down', flags: 64 });
    expect(slow.raw.deferReply).not.toHaveBeenCalled();
  });

  it('only lets the person being helped click, unless overridden', async () => {
    const other = setup({ targetId: 'someone', actorId: 'actor' });
    await tripsitmeUserClose(other.interaction);
    expect(other.raw.editReply).toHaveBeenCalledWith({ content: 'Only the user receiving help can click this button!' });
    const override = setup({ targetId: 'someone', actorId: 'actor', override: true });
    await tripsitmeUserClose(override.interaction);
    expect(override.thread.send).toHaveBeenCalled();
  });

  it('explains when there is no open session', async () => {
    const s = setup({ ticket: false });
    await tripsitmeUserClose(s.interaction);
    expect(JSON.stringify(s.raw.editReply.mock.calls[0][0])).toContain('you do not have an open session');
  });

  it('closes the session: removes needshelp, restores roles, thanks the user and surveys them', async () => {
    const s = setup({ roles: `r1,r-above,everyone,nh,${e.ROLE_TEAMTRIPSIT}` });
    await tripsitmeUserClose(s.interaction);
    await flushPromises();
    expect(s.target.roles.remove).toHaveBeenCalledWith(expect.objectContaining({ id: 'nh' }));
    expect(s.target.roles.add.mock.calls.map(c => (c[0] as RoleStub).id)).toEqual(['r1']);
    expect(s.raw.editReply).toHaveBeenCalledWith(expect.stringContaining("we're glad you're doing better"));
    expect(s.surveyMessage.react).toHaveBeenCalledTimes(5);
    expect(mocks.setName).toHaveBeenCalledWith(s.thread, expect.stringContaining("Target's channel!"));
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith({
      where: { id: 't1' }, data: { status: 'CLOSED', archived_at: expiry.archivedAt, deleted_at: expiry.deletedAt },
    });
    expect(s.metaChannel.send).toHaveBeenCalledWith({ content: expect.stringContaining('no longer need help') });
  });

  it('keeps going when a previous role cannot be given back', async () => {
    const s = setup({ roles: 'r1,r2' });
    s.target.roles.add.mockRejectedValueOnce(new Error('Missing Permissions'));
    await tripsitmeUserClose(s.interaction);
    await flushPromises();
    expect(s.target.roles.add).toHaveBeenCalledTimes(2);
    expect(s.raw.editReply).toHaveBeenCalledWith(expect.stringContaining("we're glad you're doing better"));
  });

  it('thanks survey responders, tells the team, and cleans up', async () => {
    const s = setup();
    await tripsitmeUserClose(s.interaction);
    await flushPromises();
    await s.handlers.collect({ emoji: { name: '🙂' } });
    expect(s.thread.send).toHaveBeenCalledWith(expect.stringContaining('here\'s a cookie'));
    expect(s.metaChannel.send).toHaveBeenLastCalledWith({ embeds: [expect.anything()] });
    expect(s.surveyMessage.delete).toHaveBeenCalled();
    expect(s.collector.stop).toHaveBeenCalled();
    const { filter } = (s.surveyMessage.createReactionCollector.mock.calls[0] as unknown as [{ filter: (r: unknown, u: unknown) => boolean }])[0];
    expect(filter({ emoji: { name: '🙂' } }, { id: 'actor' })).toBe(true);
    expect(filter({ emoji: { name: '🙂' } }, { id: 'other' })).toBe(false);
    expect(filter({ emoji: { name: '🍕' } }, { id: 'actor' })).toBe(false);
    expect(filter({ emoji: { name: null } }, { id: 'actor' })).toBe(false);
  });

  it('survives meta channel failures when reporting survey results', async () => {
    const s = setup();
    await tripsitmeUserClose(s.interaction);
    await flushPromises();
    s.metaChannel.send.mockRejectedValueOnce(new Error('left guild'));
    await expect(s.handlers.collect({ emoji: { name: '😐' } })).resolves.toBeUndefined();
  });

  it('un-archives archived threads and renames per-ticket meta threads', async () => {
    const s = setup({ archived: true, metaTicket: true });
    await tripsitmeUserClose(s.interaction);
    await flushPromises();
    expect(s.thread.setArchived).toHaveBeenCalledWith(false);
    expect(mocks.setName).toHaveBeenCalledTimes(2);
  });

  it('copes with a skipped or deleted needshelp role', async () => {
    const above = setup({ needshelp: 'above' });
    await tripsitmeUserClose(above.interaction);
    expect(above.target.roles.remove).not.toHaveBeenCalled();
    const gone = setup({ needshelp: 'fail' });
    await tripsitmeUserClose(gone.interaction);
    expect(dbMock.discord_guilds.update).toHaveBeenCalledWith({ where: { id: 'g1' }, data: { role_needshelp: null } });
    const unset = setup({ needshelp: 'unset' });
    await tripsitmeUserClose(unset.interaction);
    expect(unset.thread.send).toHaveBeenCalled();
  });

  it('clears a deleted meta channel and deleted meta thread references', async () => {
    const s = setup({ metaChannelFetch: 'fail' });
    await tripsitmeUserClose(s.interaction);
    expect(dbMock.discord_guilds.update).toHaveBeenCalledWith({ where: { id: 'g1' }, data: { channel_tripsitmeta: null } });
    const thread = setup({ metaChannelFetch: 'fail', metaTicket: true });
    await tripsitmeUserClose(thread.interaction);
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { meta_thread_id: null } });
  });

  it('does not touch roles on BlueLight', async () => {
    const s = setup({ roles: 'r1', guildId: e.DISCORD_BL_ID });
    await tripsitmeUserClose(s.interaction);
    await flushPromises();
    expect(s.target.roles.add).not.toHaveBeenCalled();
  });

  it('closes out tickets whose thread was deleted', async () => {
    const s = setup({ threadFetch: 'fail' });
    await tripsitmeUserClose(s.interaction);
    expect(s.raw.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('likely deleted manually') });
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: expect.objectContaining({ status: 'DELETED' }) });
  });

  it('keeps going if the thank-you reply cannot be sent', async () => {
    const s = setup({ editReplyFails: true });
    await tripsitmeUserClose(s.interaction);
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'CLOSED' }) }));
  });
});
