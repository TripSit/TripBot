import { resolvingModal } from '../../../vitest/utils/commandStubs';
/* eslint-disable max-len, sonarjs/no-duplicate-string */
import { EmbedBuilder } from 'discord.js';
import {
  cooperativeApplyButton, cooperativeLeaveButton, dCooperative, sendCooperativeMessage,
} from '../../commands/guild/d.cooperative';
import { lastReply, slashStub } from '../../../vitest/utils/commandStubs';

const mocks = vi.hoisted(() => ({ missing: vi.fn(), guild: vi.fn() }));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../utils/checkPermissions', () => ({ missingPermission: mocks.missing }));
vi.mock('../../../global/utils/dbRecords', () => ({ getOrCreateGuild: mocks.guild }));

const e = env as unknown as Record<string, string>;
const title = (s: ReturnType<typeof slashStub>) => ((lastReply(s).embeds as Array<{ data: { title: string } }> | undefined)?.[0].data.title);

const createGuild = () => ({
  id: 'g1',
  roles: { everyone: { id: 'ev' }, create: vi.fn(async () => ({ id: 'newrole' })) },
  channels: { create: vi.fn(async () => ({ id: 'newchan', name: 'new' })) },
});

describe('cooperative command', () => {
  beforeEach(() => {
    mocks.guild.mockResolvedValue({ cooperative: true });
    mocks.missing.mockResolvedValue(null);
    db.discord_guilds.update = vi.fn() as never;
    db.discord_guilds.upsert = vi.fn() as never;
  });

  it('requires a guild', async () => {
    expect(await dCooperative.execute(slashStub({ guild: null, subcommand: 'info' }) as never)).toBe(false);
  });

  it('info shows the regulations', async () => {
    const stub = slashStub({ subcommand: 'info', guild: createGuild() });
    expect(await dCooperative.execute(stub as never)).toBe(true);
    expect(title(stub)).toBe('TripSit Discord Cooperative Info');
  });

  it('apply: not in a guild, already a member, and the application prompt', async () => {
    const already = slashStub({ subcommand: 'apply', guild: createGuild() });
    await dCooperative.execute(already as never);
    expect(title(already)).toContain('already part');
    mocks.guild.mockResolvedValueOnce({ cooperative: false });
    const fresh = slashStub({ subcommand: 'apply', guild: createGuild() });
    await dCooperative.execute(fresh as never);
    expect(title(fresh)).toContain('Join the TripSit');
    expect(lastReply(fresh).components).toHaveLength(1);
  });

  it('leave: non-members get told, members get a confirmation button', async () => {
    mocks.guild.mockResolvedValueOnce({ cooperative: false });
    const non = slashStub({ subcommand: 'leave', guild: createGuild() });
    await dCooperative.execute(non as never);
    expect(title(non)).toContain('not part');
    const member = slashStub({ subcommand: 'leave', guild: createGuild() });
    await dCooperative.execute(member as never);
    expect(title(member)).toContain('Leave the TripSit');
  });

  describe('setup', () => {
    const opts = { trust_score_limit: 50 };

    it('requires membership and ViewAuditLog', async () => {
      mocks.guild.mockResolvedValueOnce({ cooperative: false });
      const non = slashStub({ subcommand: 'setup', guild: createGuild(), options: opts });
      await dCooperative.execute(non as never);
      expect(title(non)).toContain('not part');
      mocks.missing.mockResolvedValueOnce('ViewAuditLog');
      const noPerm = slashStub({ subcommand: 'setup', guild: createGuild(), options: opts });
      await dCooperative.execute(noPerm as never);
      expect(lastReply(noPerm).content).toContain('ViewAuditLog');
    });

    it('creates every missing channel and role', async () => {
      const guild = createGuild();
      const stub = slashStub({ subcommand: 'setup', guild, options: opts });
      expect(await dCooperative.execute(stub as never)).toBe(true);
      expect(guild.channels.create).toHaveBeenCalledTimes(4);
      expect(guild.roles.create).toHaveBeenCalledTimes(1);
      expect(title(stub)).toBe('Cooperative setup complete!');
      expect(db.discord_guilds.update).toHaveBeenCalledWith(expect.objectContaining({ data: { channel_helpdesk: 'newchan' } }));
    });

    it('uses supplied channels and roles', async () => {
      const guild = createGuild();
      const options = {
        ...opts,
        helpdesk_channel: { id: 'h', name: 'h' },
        trust_channel: { id: 't', name: 't' },
        mod_channel: { id: 'm', name: 'm' },
        modlog_channel: { id: 'l', name: 'l' },
        mod_role: { id: 'r' },
      };
      const stub = slashStub({ subcommand: 'setup', guild, options });
      await dCooperative.execute(stub as never);
      expect(guild.channels.create).not.toHaveBeenCalled();
      expect(guild.roles.create).not.toHaveBeenCalled();
      expect(db.discord_guilds.update).toHaveBeenCalledWith(expect.objectContaining({ data: { role_moderator: 'r' } }));
    });
  });

  describe('add / remove (owner only)', () => {
    beforeEach(() => {
      (global as unknown as Record<string, unknown>).discordClient = { guilds: { fetch: vi.fn(async () => ({ id: 'g2', name: 'Other' })) } };
    });

    it.each(['add', 'remove'])('%s is restricted', async sub => {
      const stub = slashStub({ subcommand: sub, guild: createGuild(), options: { guild_id: 'g2' } });
      await dCooperative.execute(stub as never);
      expect(title(stub)).toBe('This action is restricted!');
    });

    it.each([['add', true, 'added'], ['remove', false, 'removed']])('%s changes membership', async (sub, coop, word) => {
      const stub = slashStub({
        subcommand: sub, guild: createGuild(), user: { id: e.DISCORD_OWNER_ID }, options: { guild_id: 'g2' },
      });
      await dCooperative.execute(stub as never);
      expect(db.discord_guilds.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { cooperative: coop } }));
      expect(title(stub)).toContain(word);
    });
  });

  it('unknown subcommands send an empty response', async () => {
    const stub = slashStub({ subcommand: 'zzz', guild: createGuild() });
    expect(await dCooperative.execute(stub as never)).toBe(true);
  });
});

describe('cooperative buttons', () => {
  // Regression test for TripSit/TripBot#1372: the modal used to fail validation and its submit filter never matched.
  it('apply shows its modal and thanks the applicant when they submit', async () => {
    const submit = { customId: 'cooperativeApply~i1', deferReply: vi.fn(), editReply: vi.fn() };
    const other = { customId: 'cooperativeApply~zzz', deferReply: vi.fn(), editReply: vi.fn() };
    const a = { id: 'i1', showModal: vi.fn(), awaitModalSubmit: vi.fn(resolvingModal(submit)) };
    const b = { id: 'i1', showModal: vi.fn(), awaitModalSubmit: vi.fn(resolvingModal(other)) };
    expect(await cooperativeApplyButton(a as never)).toBe(true);
    await cooperativeApplyButton(b as never);
    await new Promise(r => { setTimeout(r, 5); });
    expect(a.showModal).toHaveBeenCalled();
    expect(submit.editReply).toHaveBeenCalled();
    expect(other.deferReply).not.toHaveBeenCalled();
    const ids = (a.showModal.mock.calls[0][0] as { components: Array<{ components: Array<{ data: { custom_id: string } }> }> }).components
      .map(row => row.components[0].data.custom_id);
    expect(new Set(ids).size).toBe(ids.length);
    const filter = (a.awaitModalSubmit.mock.calls[0][0] as { filter: (i: { customId: string }) => boolean }).filter;
    expect(filter({ customId: 'cooperativeApply~i1' })).toBe(true);
    expect(filter({ customId: 'reportModal~i1' })).toBe(false);
  });

  it('leave removes the guild from the cooperative', async () => {
    db.discord_guilds.upsert = vi.fn() as never;
    const stub = { deferReply: vi.fn(), editReply: vi.fn(), guild: { id: 'g1' } };
    await cooperativeLeaveButton(stub as never);
    expect(db.discord_guilds.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { cooperative: false } }));
    expect(stub.editReply).toHaveBeenCalled();
  });
});

describe('sendCooperativeMessage', () => {
  const setup = (data: Record<string, unknown>, opts: { channelFails?: boolean; roleFails?: boolean } = {}) => {
    const send = vi.fn();
    db.discord_guilds.upsert = vi.fn().mockResolvedValue(data) as never;
    db.discord_guilds.update = vi.fn() as never;
    (global as unknown as Record<string, unknown>).discordClient = {
      channels: { fetch: opts.channelFails ? vi.fn().mockRejectedValue(new Error('x')) : vi.fn(async () => ({ send })) },
      guilds: { fetch: vi.fn(async () => ({ roles: { fetch: opts.roleFails ? vi.fn().mockRejectedValue(new Error('x')) : vi.fn(async () => 'ROLE') } })) },
    };
    return send;
  };

  it('pings the moderator role in each configured guild', async () => {
    const send = setup({ channel_moderators: 'c', role_moderator: 'r' });
    await sendCooperativeMessage(new EmbedBuilder(), ['g1', 'g2']);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('skips guilds that are not configured', async () => {
    const send = setup({ channel_moderators: null, role_moderator: null });
    await sendCooperativeMessage(new EmbedBuilder(), ['g1']);
    expect(send).not.toHaveBeenCalled();
  });

  it('forgets a deleted role', async () => {
    const send = setup({ channel_moderators: 'c', role_moderator: 'r' }, { roleFails: true });
    await sendCooperativeMessage(new EmbedBuilder(), ['g1']);
    expect(db.discord_guilds.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ role_moderator: null }) }));
    expect(send).toHaveBeenCalled();
  });

  // The deleted-channel branch continues to call .send on an empty object and throws.
  it('forgets a deleted channel, then fails sending to it', async () => {
    setup({ channel_moderators: 'c', role_moderator: 'r' }, { channelFails: true });
    await expect(sendCooperativeMessage(new EmbedBuilder(), ['g1'])).rejects.toThrow();
    expect(db.discord_guilds.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ channel_moderators: null }) }));
  });
});
