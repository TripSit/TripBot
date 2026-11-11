/* eslint-disable max-len, sonarjs/no-duplicate-string, no-restricted-syntax, no-promise-executor-return, no-await-in-loop */
import { ChannelType } from 'discord.js';
import {
  buttonReactionRole, createColorMessage, createMindsetMessage, createNotificationMessage, createPremiumColorMessage, createPronounMessage,
  dReactionRole, setupCustomReactionRole,
} from '../../commands/global/d.reactionRole';
import { slashStub, resolvingModal, pendingModal } from '../../../vitest/utils/commandStubs';
import { flushPromises } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({ missing: vi.fn(), guild: vi.fn(), user: vi.fn() }));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../utils/checkPermissions', () => ({ missingPermission: mocks.missing }));
vi.mock('../../../global/utils/dbRecords', () => ({ getOrCreateGuild: mocks.guild, getOrCreateUser: mocks.user }));

const e = env as unknown as Record<string, string>;

beforeAll(() => { (global as unknown as Record<string, unknown>).emojiGet = vi.fn(() => ({ id: '1', url: 'https://e' })); });
const reply = (s: { reply: { mock: { calls: unknown[][] } } }) => JSON.stringify(s.reply.mock.calls[0][0]);

const names = {
  COLOR: ['Tulip', 'Marigold', 'Daffodil', 'Waterlily', 'Bluebell', 'Hyacinth', 'Azalea', 'Snowdrop'],
  PREMIUM_COLOR: ['Ruby', 'Sunstone', 'Citrine', 'Jade', 'Sapphire', 'Amethyst', 'Pezzottaite', 'Labradorite'],
  MINDSET: ['Drunk', 'High', 'Rolling', 'Tripping', 'Dissociated', 'Stimming', 'Sedated', 'Talkative', 'Working'],
  PRONOUN: ['AskMe', 'AnyPronouns', 'TheyThem', 'SheHer', 'HeHim'],
  NOTIFICATION: ['Announcements', 'Voice Chatter', 'Activity Crew', 'TripBot Updates', 'TripTown Updates'],
};
const rowsFor = (type: keyof typeof names) => names[type].map(name => ({ name, role_id: `rid-${name}`, type }));

const role = (id: string, over: Record<string, unknown> = {}) => ({
  id, name: `Role-${id}`, position: 1, comparePositionTo: vi.fn(() => -1), toString: (): string => `<@&${id}>`, ...over,
});

const guildOf = (over: Record<string, unknown> = {}) => ({
  id: 'g1',
  premiumTier: 0,
  members: { me: { roles: { highest: role('bot') } } },
  roles: { fetch: vi.fn(async (id: string) => role(id)), create: vi.fn(async () => ({ id: 'new' })) },
  channels: { fetch: vi.fn(async (id: string) => ({ id, send: vi.fn(), toString: (): string => `<#${id}>` })) },
  ...over,
});

const text = () => ({
  id: 'c1', type: ChannelType.GuildText, send: vi.fn(), toString: (): string => '<#c1>',
});

describe('setupCustomReactionRole', () => {
  const run = async (options: Record<string, unknown>, over: Record<string, unknown> = {}) => {
    const stub = slashStub({
      options: { role: role('r1'), ...options }, guild: guildOf(), channel: text(), ...over,
    });
    await setupCustomReactionRole(stub as never);
    return stub;
  };

  it('ignores contexts without guild, member or channel', async () => {
    for (const over of [{ guild: null }, { member: null }, { channel: null }]) {
      const stub = await run({ label: 'x' }, over);
      expect(stub.reply).not.toHaveBeenCalled();
    }
  });

  it.each([
    ['intro without channel', { intro_message: true, label: 'x' }, 'must specify where'],
    ['non text intro channel', { intro_message: true, intro_channel: { type: ChannelType.GuildVoice }, label: 'x' }, 'must be a text channel'],
    ['invalid emoji', { emoji: 'not-an-emoji' }, 'not a valid emoji'],
    ['several emoji', { emoji: '😀😀' }, 'only specify one emoji'],
    ['neither emoji nor label', {}, 'either an emoji or a label'],
  ])('rejects %s', async (_n, options, text_) => {
    const stub = await run(options);
    expect(reply(stub)).toContain(text_);
  });

  it('requires the bot role to outrank the target role', async () => {
    const stub = await run({ label: 'x', role: role('r1', { comparePositionTo: () => 1 }) });
    expect(reply(stub)).toContain('My role needs to be higher');
  });

  it('collects a description and posts the button', async () => {
    const channel = text();
    const submit = {
      customId: '"ID":"RR","II":"int1"', deferReply: vi.fn(), editReply: vi.fn(), fields: { getTextInputValue: vi.fn(() => 'v') },
    };
    const stub = slashStub({ options: { role: role('r1'), emoji: '😀', label: 'Click' }, guild: guildOf(), channel });
    stub.awaitModalSubmit.mockImplementationOnce(resolvingModal(submit));
    await setupCustomReactionRole(stub as never);
    await flushPromises();
    expect(stub.showModal).toHaveBeenCalled();
    expect(channel.send).toHaveBeenCalledTimes(1);
    expect(submit.editReply).toHaveBeenCalled();
    const other = slashStub({ options: { role: role('r1'), label: 'x' }, guild: guildOf(), channel });
    const foreign = { ...submit, customId: '"ID":"RR","II":"zzz"', deferReply: vi.fn() };
    other.awaitModalSubmit.mockImplementationOnce(resolvingModal(foreign));
    await setupCustomReactionRole(other as never);
    await flushPromises();
    expect(foreign.deferReply).not.toHaveBeenCalled();
  });
});

describe('buttonReactionRole', () => {
  const id = (rid: string, im: unknown = false, ic: string | null = null) => `"ID":"RR","RID":"${rid}","IM":${JSON.stringify(im)},"IC":${JSON.stringify(ic)}`;

  const button = (customId: string, memberRoles: string[] = [], guild: unknown = guildOf(), over: Record<string, unknown> = {}) => ({
    customId,
    id: 'i1',
    guild,
    channel: { id: 'c1' },
    member: {
      id: 'u1',
      displayName: 'Mem',
      toString: (): string => '<@u1>',
      roles: {
        cache: Object.assign(new Map(memberRoles.map(r => [r, { id: r, tags: {} }])), {
          has: (k: string) => memberRoles.includes(k),
          some: (fn: (r: unknown) => boolean) => memberRoles.some(r => fn({ id: r })),
          find: () => undefined,
        }),
        add: vi.fn(),
        remove: vi.fn(),
      },
    },
    deferReply: vi.fn(),
    editReply: vi.fn(),
    showModal: vi.fn(),
    awaitModalSubmit: vi.fn(pendingModal()),
    ...over,
  });

  beforeEach(() => {
    mocks.user.mockResolvedValue({ id: 'db1' });
    mocks.guild.mockResolvedValue({ premium_role_ids: null });
    db.reaction_roles.findMany = vi.fn().mockResolvedValue([]) as never;
  });

  it('ignores contexts without guild, member or channel, and unknown roles', async () => {
    await buttonReactionRole(button(id('r1'), [], null) as never);
    await buttonReactionRole(button(id('r1'), [], guildOf(), { member: null }) as never);
    await buttonReactionRole(button(id('r1'), [], guildOf(), { channel: null }) as never);
    const missing = button(id('r1'), [], guildOf({ roles: { fetch: vi.fn(async () => null) } }));
    await buttonReactionRole(missing as never);
    expect(missing.member.roles.add).not.toHaveBeenCalled();
  });

  it('removes a held role, checking hierarchy', async () => {
    const ok = button(id('r1'), ['r1']);
    await buttonReactionRole(ok as never);
    expect(ok.member.roles.remove).toHaveBeenCalled();
    const high = button(id('r1'), ['r1'], guildOf({ roles: { fetch: vi.fn(async () => role('r1', { comparePositionTo: () => 1 })) } }));
    await buttonReactionRole(high as never);
    expect(high.member.roles.remove).not.toHaveBeenCalled();
  });

  // TripSit/TripBot#1324: IM is serialised as a JSON boolean but compared to the string 'true', so the intro flow is never reached.
  it('treats a boolean intro flag as "no intro" (current behaviour, #1324)', async () => {
    const b = button(id('r1', true, '123'), ['r1']);
    await buttonReactionRole(b as never);
    expect(b.showModal).not.toHaveBeenCalled();
    expect(b.member.roles.remove).toHaveBeenCalled();
  });

  describe('intro flow (string flag)', () => {
    const introId = (rid: string, ic: string) => `"ID":"RR","RID":"${rid}","IM":"true","IC":"${ic}"`;

    it('asks for confirmation before removing a held role', async () => {
      const channelAudit = { send: vi.fn() };
      const guild = guildOf({ channels: { fetch: vi.fn(async () => channelAudit) } });
      const submit = {
        customId: '"ID":"RR","II":"i1"', deferReply: vi.fn(), editReply: vi.fn(), guild, member: { displayName: 'M' }, fields: { getTextInputValue: vi.fn(() => 'bored') },
      };
      const b = button(introId('r1', 'x'), ['r1'], guild);
      b.awaitModalSubmit = vi.fn(resolvingModal(submit));
      await buttonReactionRole(b as never);
      await flushPromises();
      expect(b.showModal).toHaveBeenCalled();
      expect(b.member.roles.remove).toHaveBeenCalled();
      expect(channelAudit.send).toHaveBeenCalledWith(expect.stringContaining('bored'));
      const foreign = button(introId('r1', 'x'), ['r1'], guild);
      const other = { ...submit, customId: '"ID":"RR","II":"zzz"', deferReply: vi.fn() };
      foreign.awaitModalSubmit = vi.fn(resolvingModal(other));
      await buttonReactionRole(foreign as never);
      await flushPromises();
      expect(other.deferReply).not.toHaveBeenCalled();
    });

    const joinFlow = async (channelId: string) => {
      const sent: unknown[] = [];
      const makeChannel = (cid: string) => ({ id: cid, send: vi.fn((m: unknown) => { sent.push(m); }), toString: (): string => `<#${cid}>` });
      const guild = guildOf({ channels: { fetch: vi.fn(async (cid: string) => makeChannel(cid)) } });
      const submit = {
        customId: '"ID":"RR","II":"i1"', deferReply: vi.fn(), editReply: vi.fn(), guild, member: { displayName: 'M' }, fields: { getTextInputValue: vi.fn(() => 'line1\nline2') },
      };
      const b = button(introId('r1', channelId), [], guild);
      b.awaitModalSubmit = vi.fn(resolvingModal(submit));
      await buttonReactionRole(b as never);
      await flushPromises();
      return { b, sent, submit };
    };

    it('ignores intro submissions that belong to another interaction or lack a guild or member', async () => {
      const run = async (submitOver: Record<string, unknown>) => {
        const guild = guildOf();
        const submit = {
          customId: '"ID":"RR","II":"i1"', deferReply: vi.fn(), editReply: vi.fn(), guild, member: { displayName: 'M' }, fields: { getTextInputValue: vi.fn(() => 'x') }, ...submitOver,
        };
        const b = button(introId('r1', 'chan'), [], guild);
        b.awaitModalSubmit = vi.fn(resolvingModal(submit));
        await buttonReactionRole(b as never);
        await flushPromises();
        return { b, submit };
      };
      const other = await run({ customId: '"ID":"RR","II":"zzz"' });
      expect(other.b.member.roles.add).not.toHaveBeenCalled();
      const dm = await run({ guild: null, reply: vi.fn() });
      expect(dm.b.member.roles.add).not.toHaveBeenCalled();
      const memberless = await run({ member: null });
      expect(memberless.submit.editReply).toHaveBeenCalledWith('This must be performed by a member of a guild!');
      expect(memberless.b.member.roles.add).not.toHaveBeenCalled();
    });

    it('posts introductions to the configured channel, with team-specific follow-ups', async () => {
      const generic = await joinFlow('some-channel');
      expect(generic.b.member.roles.add).toHaveBeenCalled();
      expect(String(generic.sent[0])).toContain('> line1');
      const meta = await joinFlow(e.CHANNEL_TRIPSITMETA);
      expect(meta.sent).toHaveLength(2);
      expect(String(meta.sent[1])).toContain('Some important information');
      const dev = await joinFlow(e.CHANNEL_DEVELOPMENT);
      expect(dev.sent).toHaveLength(2);
    });

    it('rejects role-banned helpers before asking for an intro', async () => {
      mocks.user.mockResolvedValue({ id: 'db1', helper_role_ban: true, contributor_role_ban: true });
      const helper = button(id(e.ROLE_HELPER), []);
      await buttonReactionRole(helper as never);
      expect(helper.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('Unable to add') });
      const contributor = button(id(e.ROLE_CONTRIBUTOR), []);
      await buttonReactionRole(contributor as never);
      expect(contributor.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('Unable to add') });
    });
  });

  it('adds the role and welcomes in the configured channel', async () => {
    const send = vi.fn();
    const guild = guildOf({ channels: { fetch: vi.fn(async () => ({ send })) } });
    const b = button(id('r1', false, 'chan'), [], guild);
    await buttonReactionRole(b as never);
    expect(b.member.roles.add).toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith(expect.stringContaining('has joined'));
  });

  describe('colour / mindset groups', () => {
    const groupGuild = () => guildOf({ roles: { fetch: vi.fn(async (rid: string) => role(rid.replace('rid-', ''), { id: rid })) } });
    const rowsByType = (types: Record<string, unknown[]>) => vi.fn(async (args: { where: { type: string } }) => types[args.where.type] ?? []);

    it('swaps colour roles and clears the others', async () => {
      db.reaction_roles.findMany = rowsByType({ COLOR: rowsFor('COLOR'), PREMIUM_COLOR: rowsFor('PREMIUM_COLOR'), MINDSET: [] }) as never;
      const b = button(id('rid-Tulip'), [], groupGuild());
      await buttonReactionRole(b as never);
      expect(b.member.roles.add).toHaveBeenCalled();
      expect(b.member.roles.remove).toHaveBeenCalled();
      const removed = b.member.roles.remove.mock.calls[0][0] as string[];
      expect(removed).toContain('rid-Marigold');
      expect(removed).toContain('rid-Ruby');
    });

    it('limits premium colours to premium members, boosters and purchasers', async () => {
      db.reaction_roles.findMany = rowsByType({ COLOR: [], PREMIUM_COLOR: rowsFor('PREMIUM_COLOR'), MINDSET: [] }) as never;
      const denied = button(id('rid-Ruby'), [], groupGuild());
      await buttonReactionRole(denied as never);
      expect(denied.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('do not have permission') });
      mocks.guild.mockResolvedValue({ premium_role_ids: 'vip,other' });
      const premium = button(id('rid-Ruby'), ['vip'], groupGuild());
      await buttonReactionRole(premium as never);
      expect(premium.member.roles.add).toHaveBeenCalled();
      expect(premium.member.roles.remove).toHaveBeenCalled();
      mocks.guild.mockResolvedValue({ premium_role_ids: null });
      const booster = button(id('rid-Ruby'), [], groupGuild());
      booster.member.roles.cache.find = vi.fn((fn: (r: { tags: { premiumSubscriberRole: boolean } }) => boolean) => (fn({ tags: { premiumSubscriberRole: true } }) ? {} : undefined)) as never;
      await buttonReactionRole(booster as never);
      expect(booster.member.roles.add).toHaveBeenCalled();
    });

    it('keeps one mindset at a time', async () => {
      db.reaction_roles.findMany = rowsByType({ COLOR: [], PREMIUM_COLOR: [], MINDSET: rowsFor('MINDSET') }) as never;
      const b = button(id('rid-High'), [], groupGuild());
      await buttonReactionRole(b as never);
      const removed = b.member.roles.remove.mock.calls[0][0] as string[];
      expect(removed).toContain('rid-Drunk');
      expect(removed).not.toContain('rid-High');
      const other = button(id('plain-role'), [], groupGuild());
      await buttonReactionRole(other as never);
      expect(other.member.roles.remove).not.toHaveBeenCalled();
    });
  });
});

describe('message creators', () => {
  const stubFor = (extra: Record<string, unknown> = {}, guild: unknown = guildOf({ roles: { fetch: vi.fn(async (rid: string) => role(rid)), create: vi.fn(async () => ({ id: 'new' })) } })) => {
    const channel = text();
    return { channel, stub: slashStub({ guild, channel, options: { embed_color: 'ff0000', ...extra } }) };
  };

  beforeEach(() => {
    mocks.guild.mockResolvedValue({ premium_role_ids: null });
    db.reaction_roles.upsert = vi.fn() as never;
    db.discord_guilds.update = vi.fn() as never;
  });

  it.each([
    ['color', createColorMessage, 'COLOR'],
    ['premium', createPremiumColorMessage, 'PREMIUM_COLOR'],
    ['mindset', createMindsetMessage, 'MINDSET'],
    ['pronoun', createPronounMessage, 'PRONOUN'],
    ['notification', createNotificationMessage, 'NOTIFICATION'],
  ] as const)('%s message posts buttons using existing roles', async (_n, fn, type) => {
    db.reaction_roles.findMany = vi.fn().mockResolvedValue(rowsFor(type)) as never;
    const { stub, channel } = stubFor();
    await fn(stub as never);
    expect(channel.send).toHaveBeenCalledTimes(1);
    expect(stub.editReply).toHaveBeenCalled();
  });

  it.each([
    ['color', createColorMessage, 'COLOR'],
    ['premium', createPremiumColorMessage, 'PREMIUM_COLOR'],
    ['mindset', createMindsetMessage, 'MINDSET'],
    ['pronoun', createPronounMessage, 'PRONOUN'],
    ['notification', createNotificationMessage, 'NOTIFICATION'],
  ] as const)('%s message uses the default embed colour when none is given', async (_n, fn, type) => {
    db.reaction_roles.findMany = vi.fn().mockResolvedValue(rowsFor(type)) as never;
    const { stub, channel } = stubFor({ embed_color: undefined });
    await fn(stub as never);
    expect(channel.send).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['color', createColorMessage, 'COLOR'],
    ['premium', createPremiumColorMessage, 'PREMIUM_COLOR'],
    ['mindset', createMindsetMessage, 'MINDSET'],
    ['pronoun', createPronounMessage, 'PRONOUN'],
    ['notification', createNotificationMessage, 'NOTIFICATION'],
  ] as const)('%s message creates missing roles first', async (_n, fn, type) => {
    (global as unknown as Record<string, unknown>).emojiGet = vi.fn(() => ({ id: '1', url: 'https://e' }));
    // first lookup: nothing stored; created rows are then returned for every later lookup
    db.reaction_roles.findMany = vi.fn().mockResolvedValueOnce([]).mockResolvedValue(rowsFor(type)) as never;
    const guild = guildOf({ premiumTier: 2, roles: { fetch: vi.fn(async (rid: string) => role(rid)), create: vi.fn(async () => ({ id: 'new' })) } });
    const { stub, channel } = stubFor({}, guild);
    await fn(stub as never);
    expect(guild.roles.create).toHaveBeenCalled();
    expect(db.reaction_roles.upsert).toHaveBeenCalled();
    expect(channel.send).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['color', createColorMessage, 'COLOR'],
    ['premium', createPremiumColorMessage, 'PREMIUM_COLOR'],
    ['mindset', createMindsetMessage, 'MINDSET'],
    ['pronoun', createPronounMessage, 'PRONOUN'],
    ['notification', createNotificationMessage, 'NOTIFICATION'],
  ] as const)('%s message creates missing roles with the default colour', async (_n, fn, type) => {
    (global as unknown as Record<string, unknown>).emojiGet = vi.fn(() => ({ id: '1', url: 'https://e' }));
    // first lookup: nothing stored; created rows are then returned for every later lookup
    db.reaction_roles.findMany = vi.fn().mockResolvedValueOnce([]).mockResolvedValue(rowsFor(type)) as never;
    const guild = guildOf({ premiumTier: 2, roles: { fetch: vi.fn(async (rid: string) => role(rid)), create: vi.fn(async () => ({ id: 'new' })) } });
    const { stub, channel } = stubFor({ embed_color: undefined }, guild);
    await fn(stub as never);
    expect(guild.roles.create).toHaveBeenCalled();
    expect(db.reaction_roles.upsert).toHaveBeenCalled();
    expect(channel.send).toHaveBeenCalledTimes(1);
  });

  it('stops quietly without guild, member or channel', async () => {
    for (const over of [{ guild: null }, { member: null }, { channel: null }]) {
      const stub = slashStub({ options: {}, ...over });
      await createColorMessage(stub as never);
      await createPremiumColorMessage(stub as never);
      await createMindsetMessage(stub as never);
      await createPronounMessage(stub as never);
      await createNotificationMessage(stub as never);
    }
  });

  it('premium message stores the premium role list', async () => {
    db.reaction_roles.findMany = vi.fn().mockResolvedValue(rowsFor('PREMIUM_COLOR')) as never;
    const { stub } = stubFor({ premium_roles: '<@&1> <@&2>' });
    await createPremiumColorMessage(stub as never);
    expect(db.discord_guilds.update).toHaveBeenCalledWith(expect.objectContaining({ data: { premium_role_ids: '1,2' } }));
  });

  it('notification message adds the home-guild buttons only at home', async () => {
    db.reaction_roles.findMany = vi.fn().mockResolvedValue(rowsFor('NOTIFICATION')) as never;
    const home = stubFor({}, guildOf({ id: e.DISCORD_GUILD_ID, roles: { fetch: vi.fn(async (rid: string) => role(rid)) } }));
    await createNotificationMessage(home.stub as never);
    const homeButtons = (home.channel.send.mock.calls[0][0] as { components: Array<{ components: unknown[] }> }).components[0].components.length;
    const away = stubFor();
    await createNotificationMessage(away.stub as never);
    const awayButtons = (away.channel.send.mock.calls[0][0] as { components: Array<{ components: unknown[] }> }).components[0].components.length;
    expect(homeButtons).toBe(5);
    expect(awayButtons).toBe(3);
  });

  it('getGuildRole falls back to recreating Tulip when a role cannot be found', async () => {
    (global as unknown as Record<string, unknown>).emojiGet = vi.fn(() => ({ id: '1', url: 'https://e' }));
    // rows missing => `.find(...).role_id` throws inside the try and the fallback path runs
    db.reaction_roles.findMany = vi.fn()
      .mockResolvedValueOnce(rowsFor('PRONOUN'))
      .mockResolvedValueOnce(rowsFor('PRONOUN').filter(row => row.name !== 'AskMe'))
      .mockResolvedValueOnce([{ name: 'Tulip', role_id: 'rid-Tulip' }])
      .mockResolvedValue(rowsFor('PRONOUN')) as never;
    const { stub, channel } = stubFor();
    await createPronounMessage(stub as never);
    expect(channel.send).toHaveBeenCalled();
  });
});

describe('reaction_role command', () => {
  const memberWith = (perm: boolean) => ({ id: 'u1', permissions: { has: () => perm } });
  const run = async (subcommand: string, over: Record<string, unknown> = {}, guildData: Record<string, unknown> = { partner: true }) => {
    mocks.guild.mockResolvedValue(guildData);
    mocks.missing.mockResolvedValue(null);
    const stub = slashStub({
      subcommand,
      options: { embed_color: 'ff0000', label: 'x', role: role('r1') },
      guild: guildOf(),
      channel: text(),
      member: memberWith(true),
      ...over,
      extra: { awaitModalSubmit: vi.fn(pendingModal()) },
    });
    const result = await dReactionRole.execute(stub as never);
    return { stub, result };
  };

  beforeEach(() => {
    db.reaction_roles.findMany = vi.fn().mockResolvedValue([]) as never;
    db.reaction_roles.upsert = vi.fn() as never;
  });

  it('stops when the interaction has no member', async () => {
    const { stub, result } = await run('help', { member: null });
    expect(result).toBe(false);
    expect(stub.reply).toHaveBeenCalledWith('This must be performed by a member of a guild!');
  });

  it('applies guild, partner and permission gates', async () => {
    expect((await run('help', { guild: null })).result).toBe(false);
    const nonPartner = await run('help', {}, {});
    expect(nonPartner.result).toBe(false);
    expect(reply(nonPartner.stub)).toContain('partner or supporter');
    const noPerm = await run('help', { member: memberWith(false) });
    expect(reply(noPerm.stub)).toContain('ManageRoles permission');
    const noChannel = await run('help', { channel: null });
    expect(reply(noChannel.stub)).toContain('in a channel');
    const voice = await run('help', { channel: { ...text(), type: ChannelType.GuildVoice } });
    expect(reply(voice.stub)).toContain('text channel');
  });

  it('reports missing bot permissions', async () => {
    mocks.guild.mockResolvedValue({ partner: true });
    mocks.missing.mockResolvedValueOnce('ManageRoles');
    const guildStub = slashStub({
      subcommand: 'help', guild: guildOf(), channel: text(), member: memberWith(true),
    });
    expect(await dReactionRole.execute(guildStub as never)).toBe(false);
    expect(reply(guildStub)).toContain('Missing ManageRoles');
    mocks.missing.mockResolvedValueOnce(null).mockResolvedValueOnce('SendMessages');
    const chanStub = slashStub({
      subcommand: 'help', guild: guildOf(), channel: text(), member: memberWith(true),
    });
    expect(await dReactionRole.execute(chanStub as never)).toBe(false);
    expect(reply(chanStub)).toContain('Missing SendMessages');
  });

  it('shows help and routes every subcommand', async () => {
    const help = await run('help');
    expect(help.result).toBe(true);
    expect(reply(help.stub)).toContain('Reaction Role Help');
    db.reaction_roles.findMany = vi.fn().mockResolvedValue([...rowsFor('COLOR'), ...rowsFor('PREMIUM_COLOR'), ...rowsFor('MINDSET'), ...rowsFor('PRONOUN'), ...rowsFor('NOTIFICATION')]) as never;
    for (const sub of ['color', 'premium_color', 'mindset', 'pronoun', 'notification']) {
      const { stub, result } = await run(sub);
      expect(result).toBe(true);
      expect((stub.channel as { send: ReturnType<typeof vi.fn> }).send).toHaveBeenCalled();
    }
    const custom = await run('custom');
    expect(custom.stub.showModal).toHaveBeenCalled();
    expect((await run('zzz')).result).toBe(true);
  });
});
