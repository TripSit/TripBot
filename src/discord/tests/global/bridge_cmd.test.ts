/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len, sonarjs/no-duplicate-string */
import { TextChannel } from 'discord.js';
import { dBridge } from '../../commands/global/d.bridge';
import { lastReply, slashStub } from '../../../vitest/utils/commandStubs';
import { stubInstance } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  create: vi.fn(), confirm: vi.fn(), pause: vi.fn(), remove: vi.fn(), resume: vi.fn(), missing: vi.fn(), guild: vi.fn(),
}));

vi.mock('../../../global/commands/g.bridge', () => ({
  bridgeCreate: mocks.create, bridgeConfirm: mocks.confirm, bridgePause: mocks.pause, bridgeRemove: mocks.remove, bridgeResume: mocks.resume,
}));
vi.mock('../../utils/checkPermissions', () => ({ missingPermission: mocks.missing }));
vi.mock('../../../global/utils/dbRecords', () => ({ getOrCreateGuild: mocks.guild }));

const e = env as unknown as Record<string, string>;
const text = (id: string, send = vi.fn()) => stubInstance(TextChannel, {
  id, send, guild: { name: 'G' }, name: 'n', toString: (): string => `<#${id}>`,
});
const desc = (s: ReturnType<typeof slashStub>): string => (lastReply(s).embeds as Array<{ data: { description: string } }>)[0].data.description;

const run = async (subcommand: string, opts: { home?: boolean; perm?: boolean; options?: Record<string, unknown>; channel?: unknown; client?: unknown } = {}) => {
  const stub = slashStub({
    subcommand,
    options: opts.options,
    guild: { id: opts.home === false ? 'other' : e.DISCORD_GUILD_ID, name: 'G' },
    member: { displayName: 'Mem', permissions: { has: () => opts.perm !== false } },
    channel: opts.channel ?? text('c1'),
    client: opts.client,
  });
  await dBridge.execute(stub as never);
  return stub;
};

describe('bridge command', () => {
  beforeEach(() => {
    Object.values(mocks).forEach(m => m.mockReset());
    mocks.guild.mockResolvedValue({ partner: false, supporter: false });
    mocks.missing.mockResolvedValue(null);
    (global as unknown as Record<string, unknown>).discordClient = {
      channels: { fetch: vi.fn(async () => text('ext')) },
    };
  });

  it('requires a guild and partner status', async () => {
    const dm = slashStub({ guild: null, subcommand: 'info' });
    expect(await dBridge.execute(dm as never)).toBe(false);
    const stub = slashStub({ subcommand: 'info', guild: { id: 'other' }, member: { permissions: { has: () => true } } });
    expect(await dBridge.execute(stub as never)).toBe(false);
  });

  it('checks ManageChannels for each subcommand', async () => {
    for (const sub of ['create', 'confirm', 'pause', 'resume', 'remove', 'info']) {
      // eslint-disable-next-line no-await-in-loop
      expect(desc(await run(sub, { perm: false }))).toContain('ManageChannel');
    }
  });

  describe('create', () => {
    const ext = { external_channel: '123' };
    it('validates guild, channel types and ids', async () => {
      expect(desc(await run('create', { home: false, options: ext }))).toContain('partner guild');
      // partner guild path
      mocks.guild.mockResolvedValue({ partner: true });
      expect(desc(await run('create', { home: false, options: ext }))).toContain('only be used in the TripSit');
      expect(desc(await run('create', { channel: {}, options: ext }))).toContain('not a text channel');
      mocks.missing.mockResolvedValueOnce('ManageWebhooks');
      expect(desc(await run('create', { options: ext }))).toContain('Missing ManageWebhooks');
      expect(desc(await run('create', { options: { external_channel: 'abc' } }))).toContain('not a number');
    });

    it('handles external channel problems', async () => {
      const fail = { channels: { fetch: vi.fn().mockRejectedValue(new Error('x')) } };
      expect(desc(await run('create', { options: ext, client: fail }))).toContain('does not exist');
      const notText = { channels: { fetch: vi.fn(async () => ({})) } };
      expect(desc(await run('create', { options: ext, client: notText }))).toContain('External channel is not a text');
      const ok = { channels: { fetch: vi.fn(async () => text('ext')) } };
      mocks.missing.mockResolvedValueOnce(null).mockResolvedValueOnce('ViewChannel');
      expect(desc(await run('create', { options: ext, client: ok }))).toContain('Missing ViewChannel');
    });

    it('creates the bridge and prompts the other guild', async () => {
      const send = vi.fn();
      const client = { channels: { fetch: vi.fn(async () => text('ext', send)) } };
      mocks.create.mockResolvedValueOnce('Error: dup');
      expect(desc(await run('create', { options: ext, client }))).toBe('Error: dup');
      mocks.create.mockResolvedValueOnce('ok');
      expect(desc(await run('create', { options: { ...ext, override: true }, client }))).toContain('Initializing bridge');
      expect(send).toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it('refuses the home guild and confirms elsewhere', async () => {
      expect(desc(await run('confirm'))).toContain('outside the TripSit');
      mocks.guild.mockResolvedValue({ partner: true });
      mocks.confirm.mockResolvedValueOnce('Error: none');
      expect(desc(await run('confirm', { home: false, channel: text('c2') }))).toBe('Error: none');
      const send = vi.fn();
      const client = { channels: { fetch: vi.fn(async () => text('int', send)) } };
      mocks.confirm.mockResolvedValueOnce('int');
      expect(desc(await run('confirm', { home: false, channel: text('c2'), client }))).toContain('confirmed the bridge');
      expect(send).toHaveBeenCalled();
    });
  });

  describe.each([
    ['pause', 'ACTIVE', mocks.pause, 'Paused', 'No active bridges'],
    ['resume', 'PAUSED', mocks.resume, 'Resumed', 'No paused bridges'],
  ])('%s', (sub, status, fn, done, wrong) => {
    it('home guild', async () => {
      db.bridges.findMany = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ status: 'X', external_channel: 'e' }])
        .mockResolvedValueOnce([{ status, external_channel: 'e' }]) as never;
      expect(desc(await run(sub))).toContain('No bridges found');
      expect(desc(await run(sub))).toContain(wrong);
      expect(desc(await run(sub))).toContain(`${done} 1 bridge`);
      expect(fn).toHaveBeenCalledWith('e');
    });
    it('partner guild', async () => {
      mocks.guild.mockResolvedValue({ partner: true });
      db.bridges.findFirst = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ status: 'X' }).mockResolvedValueOnce({ status }) as never;
      expect(desc(await run(sub, { home: false }))).toContain('No bridges found');
      expect(desc(await run(sub, { home: false }))).toContain(wrong);
      expect(desc(await run(sub, { home: false }))).toContain(`${done} bridge`);
    });
  });

  describe('remove', () => {
    it('home guild needs the guild id as confirmation', async () => {
      db.bridges.findMany = vi.fn().mockResolvedValueOnce([]).mockResolvedValue([{ external_channel: 'e' }]) as never;
      expect(desc(await run('remove'))).toContain('No bridges found');
      expect(desc(await run('remove'))).toContain('Are you sure');
      expect(desc(await run('remove', { options: { confirmation: e.DISCORD_GUILD_ID } }))).toContain('Removed 1 bridge');
      expect(mocks.remove).toHaveBeenCalledWith('e');
    });
    it('partner guild', async () => {
      mocks.guild.mockResolvedValue({ supporter: true });
      db.bridges.findFirst = vi.fn().mockResolvedValueOnce(null).mockResolvedValue({}) as never;
      expect(desc(await run('remove', { home: false }))).toContain('No bridges found');
      expect(desc(await run('remove', { home: false }))).toContain('Are you sure');
      expect(desc(await run('remove', { home: false, options: { confirmation: 'other' } }))).toContain('Removed bridge');
    });
  });

  describe('info', () => {
    it('home guild lists connected rooms', async () => {
      db.bridges.findMany = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ external_channel: 'e' }]) as never;
      expect(desc(await run('info'))).toContain('No bridges found');
      expect(desc(await run('info'))).toContain('connected to 1 other rooms');
    });
    it('partner guild', async () => {
      mocks.guild.mockResolvedValue({ partner: true });
      db.bridges.findFirst = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ internal_channel: 'i' }) as never;
      expect(desc(await run('info', { home: false }))).toContain('No bridges found');
      expect(desc(await run('info', { home: false }))).toContain('connected to');
    });
  });
});
