/* eslint-disable no-promise-executor-return, sonarjs/no-unused-collection, max-len, sonarjs/no-duplicate-string, no-restricted-syntax, no-await-in-loop */
import { ChannelType, TextChannel } from 'discord.js';
import { helperButton, setup } from '../../commands/global/d.setup';
import { slashStub } from '../../../vitest/utils/commandStubs';
import { flushPromises, stubInstance } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  missing: vi.fn(), appSetup: vi.fn(), paginate: vi.fn(), profile: vi.fn(), guild: vi.fn(), user: vi.fn(),
}));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../utils/checkPermissions', () => ({ missingPermission: mocks.missing }));
vi.mock('../../utils/application', () => ({ applicationSetup: mocks.appSetup }));
vi.mock('../../utils/pagination', () => ({ paginationEmbed: mocks.paginate }));
vi.mock('../../../global/commands/g.learn', () => ({ profile: mocks.profile }));
vi.mock('../../../global/utils/dbRecords', () => ({ getOrCreateGuild: mocks.guild, getOrCreateUser: mocks.user }));

const e = env as unknown as Record<string, string>;
const content = (s: { reply: { mock: { calls: unknown[][] } } }) => (s.reply.mock.calls[0][0] as { content: string }).content;
const textChannel = (over: Record<string, unknown> = {}) => stubInstance<TextChannel>(TextChannel, {
  id: 'c1', type: ChannelType.GuildText, name: 'chan', send: vi.fn(), toString: (): string => '<#c1>', ...over,
});

beforeAll(() => { (global as unknown as Record<string, unknown>).emojiGet = vi.fn(() => ({ id: '1' })); });

describe('setup command', () => {
  beforeEach(() => {
    mocks.missing.mockReset();
    mocks.missing.mockResolvedValue(null);
  });

  it('needs a channel and guild', async () => {
    const noChan = slashStub({ channel: null, subcommand: 'help' });
    expect(await setup.execute(noChan as never)).toBe(false);
    const noGuild = slashStub({ guild: null, subcommand: 'help' });
    expect(await setup.execute(noGuild as never)).toBe(false);
  });

  it('routes simple subcommands', async () => {
    await setup.execute(slashStub({ subcommand: 'applications' }) as never);
    expect(mocks.appSetup).toHaveBeenCalled();
    await setup.execute(slashStub({ subcommand: 'help' }) as never);
    expect(mocks.paginate).toHaveBeenCalled();
    expect((mocks.paginate.mock.calls[0][1] as unknown[]).length).toBe(5);
    expect(await setup.execute(slashStub({ subcommand: 'zzz' }) as never)).toBe(true);
  });

  it('rules posts the rule messages', async () => {
    const channel = { send: vi.fn() };
    const stub = slashStub({ subcommand: 'rules', channel });
    await setup.execute(stub as never);
    expect(channel.send.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('ticketbooth posts the welcome button', async () => {
    const channel = { send: vi.fn() };
    const client = { channels: { fetch: vi.fn(async () => ({ toString: (): string => '<#x>' })) } };
    const stub = slashStub({ subcommand: 'ticketbooth', channel, client });
    await setup.execute(stub as never);
    expect(channel.send).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Welcome to TripSit') }));
  });

  describe('helper', () => {
    const run = async (data: Record<string, unknown>) => {
      mocks.guild.mockResolvedValue(data);
      const channel = { send: vi.fn() };
      const client = { channels: { fetch: vi.fn(async () => ({ toString: (): string => '<#t>' })) } };
      const stub = slashStub({
        subcommand: 'helper', channel, client, guild: { id: 'g1', name: 'Guild' },
      });
      await setup.execute(stub as never);
      return { stub, channel };
    };

    it('requires the tripsit room and helper role to be set up', async () => {
      expect((await run({})).stub.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('setup the tripsit room') });
      expect((await run({ channel_tripsit: 'a', channel_tripsitmeta: 'b' })).stub.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('helper role') });
    });

    it('posts the helper sign-up message', async () => {
      const { stub, channel } = await run({ channel_tripsit: 'a', channel_tripsitmeta: 'b', role_helper: 'h' });
      expect(channel.send).toHaveBeenCalledTimes(1);
      expect(stub.editReply).toHaveBeenCalledWith({ content: 'Done!' });
    });
  });

  describe('techhelp', () => {
    const run = async (over: Record<string, unknown> = {}) => {
      db.discord_guilds.update = vi.fn().mockResolvedValue({ channel_tripsit: 'ts' }) as never;
      const guild = { id: 'g1', name: 'Guild', channels: { fetch: vi.fn(async () => ({ toString: (): string => '<#ts>' })) } };
      const stub = slashStub({
        subcommand: 'techhelp', guild, channel: textChannel(), options: { roletechreviewer: { id: 'rev' } }, extra: { awaitModalSubmit: vi.fn(() => new Promise(() => undefined)) }, ...over,
      });
      await setup.execute(stub as never);
      return stub;
    };

    it('ignores non-text channels and reports missing permissions', async () => {
      const voice = await run({ channel: { type: ChannelType.GuildVoice } });
      expect(voice.showModal).not.toHaveBeenCalled();
      mocks.missing.mockResolvedValueOnce('ManageThreads');
      const missing = await run();
      expect(content(missing)).toContain('Missing ManageThreads');
    });

    it('saves the reviewer role and posts the help desk prompt', async () => {
      const channel = textChannel();
      const submit = {
        customId: 'helpdeskModal~int1', guild: {}, channel, deferReply: vi.fn(), editReply: vi.fn(), fields: { getTextInputValue: vi.fn(() => 'v') },
      };
      const stub = await run({ channel });
      expect(stub.showModal).toHaveBeenCalled();
      const withSubmit = slashStub({
        subcommand: 'techhelp', channel, guild: { id: 'g1', name: 'Guild', channels: { fetch: vi.fn() } }, options: { roletechreviewer: { id: 'rev' } },
      });
      db.discord_guilds.update = vi.fn().mockResolvedValue({ channel_tripsit: null }) as never;
      withSubmit.awaitModalSubmit.mockResolvedValueOnce(submit);
      await setup.execute(withSubmit as never);
      await flushPromises();
      expect(db.discord_guilds.update).toHaveBeenCalledWith(expect.objectContaining({ data: { role_techhelp: 'rev' } }));
      expect(channel.send).toHaveBeenCalledTimes(1);
      const foreign = { ...submit, customId: 'helpdeskModal~zzz', deferReply: vi.fn() };
      const other = slashStub({
        subcommand: 'techhelp', channel, guild: { id: 'g1', name: 'Guild' }, options: { roletechreviewer: { id: 'rev' } },
      });
      other.awaitModalSubmit.mockResolvedValueOnce(foreign);
      await setup.execute(other as never);
      await flushPromises();
      expect(foreign.deferReply).not.toHaveBeenCalled();
    });
  });

  describe('tripsit', () => {
    const options = {
      metatripsit: { id: 'meta' }, needshelp: { id: 'nh' }, tripsitter: { id: 'ts' }, helper: { id: 'h' }, sanctuary: { id: 's' }, general: { id: 'g' },
    };
    const run = async (over: Record<string, unknown> = {}, opts: Record<string, unknown> = options) => {
      const stub = slashStub({
        subcommand: 'tripsit', guild: { id: 'g1', name: 'Guild' }, channel: textChannel(), options: opts, ...over,
      });
      await setup.execute(stub as never);
      return stub;
    };

    it('checks the guild, channel and meta channel permissions in order', async () => {
      const voice = await run({ channel: { type: ChannelType.GuildVoice } });
      expect(voice.showModal).not.toHaveBeenCalled();
      mocks.missing.mockResolvedValueOnce('ManageRoles');
      expect(content(await run())).toContain('Missing ManageRoles');
      mocks.missing.mockResolvedValueOnce(null).mockResolvedValueOnce('SendMessages');
      expect(content(await run())).toContain('Missing SendMessages');
      mocks.missing.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce('ManageThreads');
      expect(content(await run())).toContain('Missing ManageThreads');
    });

    it('stores configuration and posts the tripsit button', async () => {
      db.discord_guilds.update = vi.fn() as never;
      const channel = textChannel();
      const submit = {
        customId: 'tripsitmeModal~int1', guild: {}, channel, deferReply: vi.fn(), editReply: vi.fn(), fields: { getTextInputValue: vi.fn(() => 'v') },
      };
      const stub = slashStub({
        subcommand: 'tripsit', guild: { id: 'g1', name: 'Guild' }, channel, options,
      });
      stub.awaitModalSubmit.mockResolvedValueOnce(submit);
      await setup.execute(stub as never);
      await flushPromises();
      expect(db.discord_guilds.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ channel_tripsit: 'c1', role_helper: 'h' }) }));
      expect(channel.send).toHaveBeenCalledTimes(1);

      const bare = slashStub({
        subcommand: 'tripsit', guild: { id: 'g1', name: 'Guild' }, channel, options: { metatripsit: null },
      });
      bare.awaitModalSubmit.mockResolvedValueOnce({ ...submit });
      await setup.execute(bare as never);
      await flushPromises();
      expect(db.discord_guilds.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ channel_tripsitmeta: null, role_needshelp: null }) }));
      const foreign = { ...submit, customId: 'tripsitmeModal~zzz', deferReply: vi.fn() };
      const other = slashStub({
        subcommand: 'tripsit', guild: { id: 'g1', name: 'Guild' }, channel, options,
      });
      other.awaitModalSubmit.mockResolvedValueOnce(foreign);
      await setup.execute(other as never);
      await flushPromises();
      expect(foreign.deferReply).not.toHaveBeenCalled();
    });
  });
});

describe('helperButton', () => {
  const metaSent: string[] = [];
  const rolesOf = (held: string[]) => ({
    cache: { has: (r: string) => held.includes(r) },
    add: vi.fn(),
    remove: vi.fn(),
  });
  const press = (over: Record<string, unknown> = {}, held: string[] = [], guildId = 'g1') => ({
    guild: {
      id: guildId,
      roles: { fetch: vi.fn(async (id: string) => ({ id, name: 'Helper', toString: (): string => '<@&h>' })) },
      channels: { fetch: vi.fn(async () => ({ id: 'meta', send: vi.fn((m: string) => { metaSent.push(m); }), toString: (): string => '<#meta>' })) },
    },
    member: {
      id: 'u1', displayName: 'Mem', user: { id: 'u1' }, roles: rolesOf(held), toString: (): string => '<@u1>',
    },
    user: { id: 'u1' },
    id: 'i1',
    reply: vi.fn(),
    editReply: vi.fn(),
    showModal: vi.fn(),
    awaitModalSubmit: vi.fn(() => new Promise(() => undefined)),
    ...over,
  });
  const guildRow = (over: Record<string, unknown> = {}) => ({
    role_helper: 'h', channel_tripsitmeta: 'meta', channel_tripsit: 'ts', role_tripsitter: 'tr', ...over,
  });

  beforeEach(() => {
    metaSent.length = 0;
    mocks.guild.mockResolvedValue(guildRow());
    mocks.user.mockResolvedValue({ id: 'db1' });
    mocks.profile.mockResolvedValue({ fullName: 'Name', completedCourses: ['Intro to Tripsitting'] });
    db.users.findUnique = vi.fn().mockResolvedValue({ last_was_helper: null }) as never;
    db.users.upsert = vi.fn() as never;
  });

  it('ignores DMs', async () => {
    await helperButton(press({ guild: null }) as never);
    await helperButton(press({ member: null }) as never);
  });

  it('requires configuration, a linked account and the intro course', async () => {
    mocks.guild.mockResolvedValueOnce(guildRow({ role_helper: null }));
    const a = press();
    await helperButton(a as never);
    expect(content(a)).toContain('helper role');
    mocks.guild.mockResolvedValueOnce(guildRow({ channel_tripsitmeta: null }));
    const b = press();
    await helperButton(b as never);
    expect(content(b)).toContain('meta room');
    mocks.profile.mockResolvedValueOnce({ fullName: null });
    const c = press();
    await helperButton(c as never);
    expect(content(c)).toContain('link your Trip Sit Learn');
    mocks.profile.mockResolvedValueOnce({ fullName: 'N', completedCourses: [] });
    const d = press();
    await helperButton(d as never);
    expect(content(d)).toContain('Intro to Tripsitting');
  });

  it('handles missing users and deleted roles', async () => {
    db.users.findUnique = vi.fn().mockResolvedValue(null) as never;
    const noUser = press();
    await helperButton(noUser as never);
    expect(noUser.reply).not.toHaveBeenCalled();
    db.users.findUnique = vi.fn().mockResolvedValue({ last_was_helper: null }) as never;
    const noRole = press({ guild: { id: 'g1', roles: { fetch: vi.fn(async () => null) } } });
    await helperButton(noRole as never);
    expect(content(noRole)).toContain('was deleted');
  });

  it('honours role bans, removes the role on a second click, and welcomes returning helpers', async () => {
    mocks.user.mockResolvedValueOnce({ id: 'db1', helper_role_ban: true });
    const banned = press();
    await helperButton(banned as never);
    expect(banned.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('Unable to add') });
    const holder = press({}, ['h']);
    await helperButton(holder as never);
    expect(holder.member.roles.remove).toHaveBeenCalled();
    db.users.findUnique = vi.fn().mockResolvedValue({ last_was_helper: new Date() }) as never;
    const returning = press({}, [], e.DISCORD_GUILD_ID);
    await helperButton(returning as never);
    expect(returning.member.roles.add).toHaveBeenCalled();
    expect(content(returning)).toContain('Welcome back');
    const elsewhere = press();
    await helperButton(elsewhere as never);
    expect(content(elsewhere)).toContain('Welcome back');
  });

  it('collects an application for new helpers and announces them', async () => {
    const sent: string[] = [];
    const meta = { id: 'meta', send: vi.fn((m: string) => { sent.push(m); }) };
    const tripsitters = { send: vi.fn() };
    const guild = {
      id: e.DISCORD_GUILD_ID,
      roles: { fetch: vi.fn(async (id: string) => ({ id, name: 'Helper' })) },
      channels: { fetch: vi.fn(async (id: string) => (id === 'meta' ? meta : tripsitters)) },
    };
    const submit = {
      customId: '"ID":"RR","II":"i1"', guild, member: {}, deferReply: vi.fn(), editReply: vi.fn(), fields: { getTextInputValue: vi.fn(() => 'answer') },
    };
    const b = press({ guild });
    b.awaitModalSubmit = vi.fn().mockResolvedValue(submit);
    await helperButton(b as never);
    await flushPromises();
    expect(b.showModal).toHaveBeenCalled();
    expect(db.users.upsert).toHaveBeenCalled();
    expect(sent).toHaveLength(2);
    expect(tripsitters.send).toHaveBeenCalled();

    // a modal for a different interaction, and one for a guild without tripsit config
    const foreign = press({ guild });
    foreign.awaitModalSubmit = vi.fn().mockResolvedValue({ ...submit, customId: '"ID":"RR","II":"zzz"' });
    await helperButton(foreign as never);
    await flushPromises();
    mocks.guild.mockResolvedValue(guildRow({ role_tripsitter: null }));
    const partial = press({ guild });
    partial.awaitModalSubmit = vi.fn().mockResolvedValue(submit);
    await helperButton(partial as never);
    await flushPromises();
  });
});
