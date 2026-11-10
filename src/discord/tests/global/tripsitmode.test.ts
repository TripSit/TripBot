/* eslint-disable no-param-reassign */
/* eslint-disable max-len, sonarjs/no-duplicate-string */
import { tripsitmode } from '../../commands/global/d.tripsitmode';
import { slashStub, SlashStub, resolvingModal } from '../../../vitest/utils/commandStubs';
import { flushPromises } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  needsHelp: vi.fn(), reopen: vi.fn(), tripSitMe: vi.fn(), userClose: vi.fn(), ensure: vi.fn(), guild: vi.fn(), user: vi.fn(),
}));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../utils/tripsitme', () => ({
  needsHelpMode: mocks.needsHelp, reopenTicket: mocks.reopen, tripSitMe: mocks.tripSitMe, tripsitmeUserClose: mocks.userClose,
}));
vi.mock('../../utils/checkPermissions', () => ({
  ensurePermissions: mocks.ensure, TRIPSIT_CHANNEL_PERMS: [], tripsitChannelOwnerMessage: vi.fn(),
}));
vi.mock('../../../global/utils/dbRecords', () => ({ getOrCreateGuild: mocks.guild, getOrCreateUser: mocks.user }));

const target = { id: 't1', displayName: 'Tee' };

const withGuild = (stub: SlashStub, fetch: (id: string) => unknown): SlashStub => {
  (stub as unknown as { guild: unknown }).guild = { id: 'g1', channels: { fetch: vi.fn(async (id: string) => fetch(id)) }, roles: { fetch: vi.fn(async () => ({ name: 'NeedsHelp' })) } };
  return stub;
};

describe('tripsitmode', () => {
  beforeEach(() => {
    Object.values(mocks).forEach(m => m.mockReset());
    mocks.ensure.mockResolvedValue(true);
    mocks.guild.mockResolvedValue({ channel_tripsit: 'ts', channel_tripsitmeta: 'meta', role_needshelp: 'rn' });
    mocks.user.mockResolvedValue({ id: 'db1' });
  });

  it('off delegates to tripsitmeUserClose with a proxied interaction', async () => {
    const stub = slashStub({ subcommand: 'off', options: { user: target } });
    expect(await tripsitmode.execute(stub as never)).toBe(true);
    const proxy = mocks.userClose.mock.calls[0][0];
    expect(proxy.customId).toBe('tripsitmodeOffOverride~t1');
    await proxy.deferReply({});
    await proxy.editReply('x');
    await proxy.followUp('y');
    await proxy.showModal({});
    await proxy.awaitModalSubmit({});
    await proxy.reply('first');
    stub.deferred = true;
    await proxy.reply('second');
    expect(stub.reply).toHaveBeenCalledWith('first');
    expect(stub.followUp).toHaveBeenCalledWith('second');
  });

  it('on does nothing without a guild or a text channel', async () => {
    const noGuild = slashStub({ subcommand: 'on', options: { user: target }, guild: null });
    await tripsitmode.execute(noGuild as never);
    await flushPromises();
    expect(mocks.guild).not.toHaveBeenCalled();

    const stub = withGuild(slashStub({ subcommand: 'on', options: { user: target } }), () => ({}));
    await tripsitmode.execute(stub as never);
    await flushPromises();
    expect(stub.showModal).not.toHaveBeenCalled();
  });

  it('clears channels that cannot be fetched', async () => {
    const stub = withGuild(slashStub({ subcommand: 'on', options: { user: target } }), () => { throw new Error('gone'); });
    db.discord_guilds.update = vi.fn().mockResolvedValue({}) as never;
    await tripsitmode.execute(stub as never);
    await flushPromises();
    expect(db.discord_guilds.update).toHaveBeenCalledWith(expect.objectContaining({ data: { channel_tripsit: null } }));
  });

  it('reopens an existing ticket thread', async () => {
    const { TextChannel } = await import('discord.js');
    const { stubInstance } = await import('../../../vitest/utils/discordStubs');
    const text = stubInstance(TextChannel, {});
    const thread = { id: 'th', name: 'thread', toString: (): string => '<#th>' };
    const stub = withGuild(slashStub({ subcommand: 'on', options: { user: target } }), id => (id === 'th' ? thread : text));
    db.user_tickets.findFirst = vi.fn().mockResolvedValue({ id: 'tk', thread_id: 'th' }) as never;
    await tripsitmode.execute(stub as never);
    await flushPromises();
    expect(mocks.needsHelp).toHaveBeenCalled();
    expect(mocks.reopen).toHaveBeenCalledWith(expect.objectContaining({ status: 'OWNED' }));
    expect(stub.editReply).toHaveBeenCalled();
  });

  it('opens a modal for a new ticket and creates the thread on submit', async () => {
    const { TextChannel } = await import('discord.js');
    const { stubInstance } = await import('../../../vitest/utils/discordStubs');
    const text = stubInstance(TextChannel, {});
    const stub = withGuild(slashStub({ subcommand: 'on', options: { user: target } }), () => text);
    db.user_tickets.findFirst = vi.fn().mockResolvedValue(null) as never;
    mocks.tripSitMe.mockResolvedValue({ toString: (): string => '<#new>' });
    const submit = (id: string) => ({
      customId: id, member: 'm', deferReply: vi.fn(), editReply: vi.fn(), fields: { getTextInputValue: vi.fn(() => 'v') },
    });
    const good = submit('tripsitmeSubmit~int1');
    stub.awaitModalSubmit.mockImplementationOnce(resolvingModal(good as never));
    await tripsitmode.execute(stub as never);
    await flushPromises();
    expect(stub.showModal).toHaveBeenCalled();
    expect(good.editReply).toHaveBeenCalled();

    const other = submit('tripsitmeSubmit~zzz');
    stub.awaitModalSubmit.mockImplementationOnce(resolvingModal(other as never));
    await tripsitmode.execute(stub as never);
    await flushPromises();
    expect(other.deferReply).not.toHaveBeenCalled();
  });
});
