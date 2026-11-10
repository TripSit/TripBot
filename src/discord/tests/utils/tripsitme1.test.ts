/* eslint-disable sonarjs/no-duplicate-string */
import { TextChannel } from 'discord.js';
import {
  needsHelpMode, tripsitmeBackup, tripsitmeMeta, tripsitmeOwned,
} from '../../utils/tripsitme';
import { dbMock } from '../../../vitest/utils/mockDb';
import { collectionOf, flushPromises, stubInstance } from '../../../vitest/utils/discordStubs';

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
const role = (id: string, name = `role-${id}`, cmp = 0): RoleStub => ({ id, name, comparePositionTo: () => cmp });

beforeEach(() => {
  mocks.ensure.mockReset();
  mocks.ensure.mockResolvedValue(true);
  mocks.context.mockResolvedValue('ctx');
  mocks.getOpenTicket.mockReset();
  dbMock.users.upsert.mockResolvedValue({ id: 'uid' } as never);
  dbMock.discord_guilds.upsert.mockResolvedValue({
    id: 'g1', role_needshelp: 'nh', role_tripsitter: 'ts', role_helper: 'hp', channel_tripsitmeta: 'meta',
  } as never);
});

describe('needsHelpMode', () => {
  function setup(opts: { guildId?: string; needshelp?: 'ok' | 'fail' | 'unset'; roles?: RoleStub[]; removeFails?: boolean; addFails?: boolean; highestCmp?: number } = {}) {
    const owner = { send: vi.fn() };
    const roles = opts.roles ?? [role('r1'), role(e.ROLE_TEAMTRIPSIT, 'team'), role('everyone', '@everyone'), role('nh', 'needshelp'), role('r2')];
    const target = {
      id: 'm1',
      displayName: 'Ally',
      fetch: vi.fn(),
      guild: { id: opts.guildId ?? 'g1' },
      roles: {
        cache: collectionOf(roles.map(r => [r.id, r] as [string, RoleStub])),
        remove: opts.removeFails ? vi.fn().mockRejectedValue(new Error('Missing Permissions')) : vi.fn(),
        add: opts.addFails ? vi.fn().mockRejectedValue(new Error('Missing Permissions')) : vi.fn(),
      },
    };
    const guild = {
      id: 'g1',
      toString: (): string => 'Guild',
      fetchOwner: vi.fn(async () => owner),
      members: { fetch: vi.fn(async () => ({ roles: { highest: role('bot', 'bot', opts.highestCmp ?? 0) } })) },
      roles: { fetch: vi.fn(async () => { if (opts.needshelp === 'fail') throw new Error('Unknown Role'); return role('nh', 'needshelp'); }) },
    };
    if (opts.needshelp === 'unset') dbMock.discord_guilds.upsert.mockResolvedValue({ id: 'g1', role_needshelp: null } as never);
    const interaction = { guild, client: { user: { id: 'bot' } } };
    return {
      interaction: interaction as never, target: target as never, raw: target, owner, guild,
    };
  }

  it('does nothing without Manage Roles', async () => {
    mocks.ensure.mockResolvedValue(false);
    const s = setup();
    await needsHelpMode(s.interaction, s.target);
    expect(dbMock.users.upsert).not.toHaveBeenCalled();
  });

  it('tells the owner when the needshelp role has been deleted', async () => {
    const s = setup({ needshelp: 'fail' });
    await needsHelpMode(s.interaction, s.target);
    expect(s.owner.send).toHaveBeenCalledWith({ content: expect.stringContaining('has been deleted') });
    expect(dbMock.users.upsert).not.toHaveBeenCalled();
  });

  it('saves roles, strips non-exempt roles and adds the needshelp role', async () => {
    const s = setup();
    await needsHelpMode(s.interaction, s.target);
    await flushPromises();
    expect(dbMock.users.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { roles: `r1,${e.ROLE_TEAMTRIPSIT},everyone,nh,r2` } }));
    const removed = s.raw.roles.remove.mock.calls.map(c => (c[0] as RoleStub).id);
    expect(removed).toEqual(['r1', 'r2']);
    expect(s.raw.roles.add).toHaveBeenCalled();
  });

  it('skips roles above the bot, and leaves roles alone on BlueLight', async () => {
    const above = setup({ highestCmp: -1 });
    await needsHelpMode(above.interaction, above.target);
    await flushPromises();
    expect(above.raw.roles.remove).not.toHaveBeenCalled();
    const bl = setup({ guildId: e.DISCORD_BL_ID });
    await needsHelpMode(bl.interaction, bl.target);
    await flushPromises();
    expect(bl.raw.roles.remove).not.toHaveBeenCalled();
    expect(bl.raw.roles.add).toHaveBeenCalled();
  });

  it('DMs the owner when roles cannot be removed or added', async () => {
    const removeFail = setup({ removeFails: true, roles: [role('r1')] });
    await needsHelpMode(removeFail.interaction, removeFail.target);
    await flushPromises();
    expect(removeFail.owner.send).toHaveBeenCalledWith({ content: expect.stringContaining('error removing') });
    const addFail = setup({ addFails: true, roles: [] });
    await needsHelpMode(addFail.interaction, addFail.target);
    expect(addFail.owner.send).toHaveBeenCalledWith({ content: expect.stringContaining('error adding') });
  });

  it('works when the guild has no needshelp role configured', async () => {
    const s = setup({ needshelp: 'unset', roles: [] });
    await needsHelpMode(s.interaction, s.target);
    expect(s.raw.roles.add).toHaveBeenCalled();
  });
});

describe('ticket buttons', () => {
  const ticket = (over: Record<string, unknown> = {}) => ({
    id: 't1', thread_id: 'th', meta_thread_id: null, description: 'a description', ...over,
  });

  function setup(opts: { guild?: boolean; self?: boolean; channel?: boolean; member?: boolean; metaFetch?: 'ok' | 'fail'; threadFetch?: 'ok' | 'fail'; textChannel?: boolean } = {}) {
    const meta = { id: 'meta1', send: vi.fn() };
    const metaThread = { send: vi.fn() };
    const created = { id: 'new-meta', send: vi.fn() };
    const channelProps = { id: 'chan', send: vi.fn(), threads: { create: vi.fn(async () => created) } };
    const channel = opts.textChannel === false ? channelProps : stubInstance<TextChannel>(TextChannel, channelProps);
    const target = { id: opts.self ? 'actor' : 'target', displayName: 'Target', toString: (): string => '<@target>' };
    const interaction = {
      customId: 'tripsitmeOwned~target',
      deferReply: vi.fn(),
      editReply: vi.fn(),
      member: opts.member === false ? null : { id: 'actor', displayName: 'Actor', toString: (): string => '<@actor>' },
      channel: opts.channel === false ? null : channel,
      guild: opts.guild === false ? null : {
        id: 'g1',
        roles: { fetch: vi.fn(async (id: string) => role(id)) },
        members: { fetch: vi.fn(async () => target) },
        channels: {
          fetch: vi.fn(async (id: string) => {
            if (id === 'meta') { if (opts.metaFetch === 'fail') throw new Error('Unknown'); return meta; }
            if (id === 'th') { if (opts.threadFetch === 'fail') throw new Error('Unknown'); return { id: 'th' }; }
            return metaThread;
          }),
        },
      },
    };
    return {
      interaction: interaction as never, raw: interaction, meta, metaThread, created, channelProps,
    };
  }

  describe('tripsitmeOwned', () => {
    it('sends people outside guilds away', async () => {
      const s = setup({ guild: false });
      await tripsitmeOwned(s.interaction);
      expect(mocks.guildOnly).toHaveBeenCalled();
    });

    it('stops people owning their own ticket', async () => {
      const s = setup({ self: true });
      await tripsitmeOwned(s.interaction);
      expect(s.raw.editReply).toHaveBeenCalledWith({ content: "You can't own your own ticket!" });
    });

    it('explains when there is no open session', async () => {
      mocks.getOpenTicket.mockResolvedValue(null);
      const s = setup();
      await tripsitmeOwned(s.interaction);
      expect(JSON.stringify(s.raw.editReply.mock.calls[0][0])).toContain('does not have an open session');
    });

    it('marks the ticket owned and updates the thread names', async () => {
      mocks.getOpenTicket.mockResolvedValue(ticket({ meta_thread_id: 'other-meta' }));
      const s = setup();
      s.raw.guild!.channels.fetch.mockImplementation(async (id: string) => ({ id, send: vi.fn() }) as never);
      await tripsitmeOwned(s.interaction);
      expect(mocks.setName).toHaveBeenCalledTimes(2);
      expect(dbMock.user_tickets.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { status: 'OWNED' } });
      expect(s.raw.editReply).toHaveBeenLastCalledWith({ content: 'Thanks!' });
    });

    it('uses the shared meta channel without renaming it', async () => {
      mocks.getOpenTicket.mockResolvedValue(ticket());
      const s = setup();
      await tripsitmeOwned(s.interaction);
      expect(s.meta.send).toHaveBeenCalledWith({ content: expect.stringContaining('is receiving help!') });
      expect(mocks.setName).toHaveBeenCalledTimes(1);
    });

    it('survives deleted meta channels and threads, and stops without send permission', async () => {
      mocks.getOpenTicket.mockResolvedValue(ticket());
      const gone = setup({ metaFetch: 'fail', threadFetch: 'fail' });
      await tripsitmeOwned(gone.interaction);
      expect(dbMock.user_tickets.update).toHaveBeenCalled();
      dbMock.user_tickets.update.mockClear();
      mocks.ensure.mockResolvedValue(false);
      const blocked = setup();
      await tripsitmeOwned(blocked.interaction);
      expect(dbMock.user_tickets.update).not.toHaveBeenCalled();
    });

    it('works when no meta channel is configured', async () => {
      mocks.getOpenTicket.mockResolvedValue(ticket());
      dbMock.discord_guilds.upsert.mockResolvedValue({ id: 'g1', channel_tripsitmeta: null } as never);
      const s = setup();
      await tripsitmeOwned(s.interaction);
      expect(s.meta.send).not.toHaveBeenCalled();
      expect(s.raw.editReply).toHaveBeenLastCalledWith({ content: 'Thanks!' });
    });
  });

  describe('tripsitmeMeta', () => {
    it('validates guild, channel and member', async () => {
      await tripsitmeMeta(setup({ guild: false }).interaction);
      expect(mocks.guildOnly).toHaveBeenCalled();
      const noChannel = setup({ channel: false });
      await tripsitmeMeta(noChannel.interaction);
      expect(noChannel.raw.editReply).toHaveBeenCalledWith('This must be performed in a channel!');
      const noMember = setup({ member: false });
      await tripsitmeMeta(noMember.interaction);
      expect(noMember.raw.editReply).toHaveBeenCalledWith('This must be performed by a member!');
    });

    it('explains when there is no open session', async () => {
      mocks.getOpenTicket.mockResolvedValue(null);
      const s = setup();
      await tripsitmeMeta(s.interaction);
      expect(JSON.stringify(s.raw.editReply.mock.calls[0][0])).toContain('does not have an open session');
    });

    it('creates a private discussion thread and records it on the ticket', async () => {
      mocks.getOpenTicket.mockResolvedValue(ticket());
      const s = setup();
      await tripsitmeMeta(s.interaction);
      expect(s.channelProps.threads.create).toHaveBeenCalledWith(expect.objectContaining({ invitable: false }));
      expect(dbMock.user_tickets.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { meta_thread_id: 'new-meta' } });
      const [{ embeds, components }] = s.created.send.mock.calls[0] as unknown as [{ embeds: Array<{ data: { description: string } }>; components: unknown[] }];
      expect(embeds[0].data.description).toContain('a description');
      expect(JSON.stringify(components)).toContain('tripsitmeBackup~target');
      expect(JSON.stringify(components)).not.toContain('tripsitmeMeta~');
      expect(s.raw.editReply).toHaveBeenLastCalledWith({ content: 'Donezo!' });
    });
  });

  describe('tripsitmeBackup', () => {
    it('validates guild and channel', async () => {
      await tripsitmeBackup(setup({ guild: false }).interaction);
      expect(mocks.guildOnly).toHaveBeenCalled();
      const noChannel = setup({ channel: false });
      await tripsitmeBackup(noChannel.interaction);
      expect(noChannel.raw.editReply).toHaveBeenCalledWith('This must be performed in a channel!');
    });

    it('explains when there is no open session', async () => {
      mocks.getOpenTicket.mockResolvedValue(null);
      const s = setup();
      await tripsitmeBackup(s.interaction);
      expect(JSON.stringify(s.raw.editReply.mock.calls[0][0])).toContain('does not have an open session');
    });

    it('pings the team in the current channel', async () => {
      mocks.getOpenTicket.mockResolvedValue(ticket());
      const s = setup();
      await tripsitmeBackup(s.interaction);
      const text = s.channelProps.send.mock.calls[0][0] as string;
      expect(text).toContain('<@&ts>');
      expect(text).toContain('and/or <@&hp>');
      expect(text).toContain('could use some backup');
      expect(s.raw.editReply).toHaveBeenLastCalledWith({ content: 'Backup message sent!' });
    });

    it('pings in the meta thread when there is one, and forgets deleted ones', async () => {
      mocks.getOpenTicket.mockResolvedValue(ticket({ meta_thread_id: 'mt' }));
      const s = setup();
      await tripsitmeBackup(s.interaction);
      expect(s.metaThread.send).toHaveBeenCalled();
      s.metaThread.send.mockRejectedValueOnce(new Error('Unknown Channel'));
      await tripsitmeBackup(s.interaction);
      expect(dbMock.user_tickets.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { meta_thread_id: null } });
    });

    it('works without configured roles, and in non-text channels', async () => {
      mocks.getOpenTicket.mockResolvedValue(ticket());
      dbMock.discord_guilds.upsert.mockResolvedValue({ id: 'g1', role_tripsitter: null, role_helper: null } as never);
      const s = setup();
      await tripsitmeBackup(s.interaction);
      expect(s.channelProps.send.mock.calls[0][0]).toContain('team,');
      const other = setup({ textChannel: false });
      await tripsitmeBackup(other.interaction);
      expect(other.raw.editReply).toHaveBeenLastCalledWith({ content: 'Backup message sent!' });
    });
  });
});
