import { Collection, EmbedBuilder } from 'discord.js';
import { resolvingModal } from '../../../vitest/utils/commandStubs';
/* eslint-disable sonarjs/no-duplicate-string */
import { techHelpClick, techHelpClose, techHelpOwn } from '../../utils/techHelp';
import trust, { addedVerified } from '../../utils/trust';
import { dbMock } from '../../../vitest/utils/mockDb';
import { collectionOf, flushPromises } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  guildOnly: vi.fn(),
  setModName: vi.fn(),
  trustScore: vi.fn(),
  topic: vi.fn(),
  giveMilestone: vi.fn(),
  userInfoEmbed: vi.fn(),
  note: vi.fn(() => ({ id: 'note' })),
  warn: vi.fn(() => ({ id: 'warn' })),
  timeout: vi.fn(() => ({ id: 'timeout' })),
  ban: vi.fn(() => ({ id: 'ban' })),
  info: vi.fn(() => ({ id: 'info' })),
}));

vi.mock('../../utils/guildOnly', () => ({ replyGuildOnly: mocks.guildOnly }));
vi.mock('../../utils/ticketIcons', async importOriginal => ({ ...(await importOriginal<object>()), setModTicketChannelName: mocks.setModName }));
vi.mock('../../utils/trustScore', () => ({ tripSitTrustScore: mocks.trustScore, default: mocks.trustScore }));
vi.mock('../../../global/commands/g.topic', () => ({ topic: mocks.topic }));
vi.mock('../../../global/utils/experience', () => ({ giveMilestone: mocks.giveMilestone }));
vi.mock('../../utils/modUtils', () => ({
  userInfoEmbed: mocks.userInfoEmbed,
  modButtonNote: mocks.note,
  modButtonWarn: mocks.warn,
  modButtonTimeout: mocks.timeout,
  modButtonBan: mocks.ban,
  modButtonInfo: mocks.info,
}));

describe('techHelpClick', () => {
  const guildRow = (role: string | null) => dbMock.discord_guilds.upsert.mockResolvedValue({ role_techhelp: role } as never);

  function setup(opts: { guild?: boolean; role?: unknown; issue?: string; submitId?: string; submitGuild?: boolean; actor?: 'member' | 'user' | 'none' } = {}) {
    const thread = { send: vi.fn(), toString: (): string => '<#thread>' };
    const members = new Map<string, { displayName: string }>([['111', { displayName: 'Ally' }]]);
    const roles = new Map<string, { name: string }>([['222', { name: 'Mods' }]]);
    const submit = {
      customId: `techHelpSubmit~${opts.submitId ?? 'int1'}`,
      deferReply: vi.fn(),
      editReply: vi.fn(),
      guild: opts.submitGuild === false ? null : {
        members: { fetch: vi.fn(async (id: string) => { const m = members.get(id); if (!m) throw new Error('Unknown'); return m; }) },
        roles: { fetch: vi.fn(async (id: string) => { const r = roles.get(id); if (!r) throw new Error('Unknown'); return r; }) },
      },
      fields: { getTextInputValue: vi.fn(() => 'It broke <@111> and <@&222> and <@999> and <@&999> @everyone') },
      member: opts.actor === 'user' || opts.actor === 'none' ? null : { id: 'a1', displayName: 'Ally', toString: (): string => '<@a1>' },
      user: opts.actor === 'none' ? null : { id: 'a1', username: 'ally_user', toString: (): string => '<@a1>' },
      channel: { threads: { create: vi.fn(async () => thread) } },
    };
    const interaction = {
      id: 'int1',
      customId: `techHelpClick~${opts.issue ?? 'discord'}`,
      showModal: vi.fn(),
      reply: vi.fn(),
      guild: opts.guild === false ? null : { id: 'g1', name: 'TripSit', roles: { fetch: vi.fn(async () => ('role' in opts ? opts.role : { toString: (): string => '<@&tech>' })) } },
      awaitModalSubmit: vi.fn(resolvingModal(submit)),
    };
    return {
      interaction: interaction as never, raw: interaction, submit, thread,
    };
  }

  it('sends people outside guilds away', async () => {
    const { interaction } = setup({ guild: false });
    await techHelpClick(interaction);
    expect(mocks.guildOnly).toHaveBeenCalledWith(interaction, { ephemeral: true });
  });

  it('tells users when the tech role is missing', async () => {
    guildRow(null);
    const none = setup();
    await techHelpClick(none.interaction);
    expect(none.raw.reply).toHaveBeenCalledWith({ content: 'The role provided could not be found!' });
    guildRow('role1');
    const missing = setup({ role: null });
    await techHelpClick(missing.interaction);
    expect(missing.raw.reply).toHaveBeenCalled();
  });

  it.each([['discord', 'I have an issue with TripSit'], ['other', 'super cool']])('shows a %s modal with a helpful placeholder', async (issue, phrase) => {
    guildRow('role1');
    const { interaction, raw } = setup({ issue });
    await techHelpClick(interaction);
    expect(JSON.stringify(raw.showModal.mock.calls[0][0])).toContain(phrase);
    await flushPromises();
  });

  it('opens a private ticket thread, mentioning the team and scrubbing user mentions', async () => {
    guildRow('role1');
    const { interaction, submit, thread } = setup();
    await techHelpClick(interaction);
    await flushPromises();
    expect(submit.deferReply).toHaveBeenCalled();
    const [created] = submit.channel.threads.create.mock.calls[0] as unknown as [{ name: string; invitable: boolean }];
    expect(created.name).toContain("Ally's discord issue!");
    expect(created.invitable).toBe(false);
    const [{ content, components }] = thread.send.mock.calls[0] as unknown as [{ content: string; components: unknown[] }];
    expect(content).toContain('@Ally and @Mods and unknown-user and unknown-user @​everyone');
    expect(JSON.stringify(components)).toContain('techHelpOwn~discord~a1');
    expect(submit.editReply).toHaveBeenCalled();
  });

  it('falls back to the username or a deleted-account placeholder', async () => {
    guildRow('role1');
    const user = setup({ actor: 'user' });
    await techHelpClick(user.interaction);
    await flushPromises();
    expect((user.submit.channel.threads.create.mock.calls[0] as unknown as [{ name: string }])[0].name).toContain("ally_user's");
    const none = setup({ actor: 'none' });
    await techHelpClick(none.interaction);
    await flushPromises();
    expect((none.submit.channel.threads.create.mock.calls[0] as unknown as [{ name: string }])[0].name).toContain('[Deleted Discord Account]');
  });

  it('ignores modal submissions from other clicks and handles guild-less submissions', async () => {
    guildRow('role1');
    const other = setup({ submitId: 'someone-else' });
    await techHelpClick(other.interaction);
    await flushPromises();
    expect(other.submit.deferReply).not.toHaveBeenCalled();
    const dm = setup({ submitGuild: false });
    await techHelpClick(dm.interaction);
    await flushPromises();
    expect(mocks.guildOnly).toHaveBeenCalled();
  });
});

describe('techHelpOwn / techHelpClose', () => {
  const target = { displayName: 'Ally' };
  const interaction = (over: Record<string, unknown> = {}) => ({
    guild: { members: { fetch: vi.fn(async () => target) } },
    customId: 'techHelpOwn~discord~111',
    reply: vi.fn(),
    member: { displayName: 'Mod' },
    channel: { name: 'x│y' },
    ...over,
  });

  it('own: ignores DMs, blocks self-claims, and renames the thread when claimed', async () => {
    await techHelpOwn(interaction({ guild: null }) as never);
    const self = interaction({ member: target });
    await techHelpOwn(self as never);
    expect(self.reply).toHaveBeenCalledWith(expect.objectContaining({ flags: 64 }));
    expect(mocks.setModName).not.toHaveBeenCalled();
    const claim = interaction();
    await techHelpOwn(claim as never);
    expect(mocks.setModName).toHaveBeenCalledWith(claim.channel, expect.stringContaining("Ally's discord issue!"));
    expect(JSON.stringify(claim.reply.mock.calls[0][0])).toContain('Mod has claimed this');
  });

  it('close: ignores DMs and anonymous clicks', async () => {
    await techHelpClose(interaction({ guild: null }) as never);
    await techHelpClose(interaction({ member: null }) as never);
    expect(mocks.setModName).not.toHaveBeenCalled();
  });

  it('close: distinguishes users closing their own issue from mods resolving it', async () => {
    const own = interaction({ member: target, customId: 'techHelpClose~discord~111' });
    await techHelpClose(own as never);
    expect(mocks.setModName).toHaveBeenLastCalledWith(own.channel, expect.stringContaining('│y'));
    expect(JSON.stringify(own.reply.mock.calls[0][0])).toContain('no longer need help');
    const mod = interaction({ customId: 'techHelpClose~discord~111' });
    await techHelpClose(mod as never);
    expect(JSON.stringify(mod.reply.mock.calls[0][0])).toContain('has been resolved');
  });

  it('close: copes with users who left the guild', async () => {
    const gone = interaction({ guild: { members: { fetch: vi.fn().mockRejectedValue(new Error('Unknown Member')) } } });
    await techHelpClose(gone as never);
    expect(gone.reply).toHaveBeenCalled();
  });
});

describe('addedVerified', () => {
  const lounge = { send: vi.fn() };
  const member = (joinedAgoMs: number | null) => ({
    id: 'm1',
    displayName: 'Ally',
    toString: (): string => '<@m1>',
    user: { username: 'ally', discriminator: '0' },
    guild: { id: 'g1' },
    joinedAt: joinedAgoMs === null ? null : new Date(Date.now() - joinedAgoMs),
    client: { channels: { fetch: vi.fn(async () => lounge) } },
  });
  const trustChannel = { send: vi.fn() };
  const logChannel = { send: vi.fn() };

  function setup(opts: { trusted?: boolean; trustChannel?: string | null; upsertFails?: boolean } = {}) {
    dbMock.discord_guilds.upsert.mockResolvedValue({ id: 'g1', channel_trust: opts.trustChannel === undefined ? 'trust' : opts.trustChannel } as never);
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', discord_id: 'm1' } as never);
    if (opts.upsertFails) dbMock.members.upsert.mockRejectedValueOnce(new Error('db'));
    else dbMock.members.upsert.mockResolvedValueOnce({ trusted: !!opts.trusted } as never);
    (global as unknown as { discordClient: unknown }).discordClient = {
      channels: { fetch: vi.fn(async (id: string) => (id === 'trust' ? trustChannel : logChannel)) },
    };
    mocks.topic.mockResolvedValue('a topic');
  }

  it('does not re-welcome already-trusted members', async () => {
    setup({ trusted: true });
    await addedVerified(member(1000) as never);
    expect(trustChannel.send).toHaveBeenCalledWith(expect.stringContaining('already marked at trusted'));
    expect(lounge.send).not.toHaveBeenCalled();
    setup({ trusted: true, trustChannel: null });
    await addedVerified(member(1000) as never);
  });

  it('welcomes members who joined within a day, and records them as trusted', async () => {
    setup();
    await addedVerified(member(60_000) as never);
    expect(logChannel.send).toHaveBeenCalledWith({ content: 'ally#0 was verified!' });
    expect(lounge.send.mock.calls[0][0].content).toContain('*a topic*');
    expect(dbMock.members.upsert).toHaveBeenLastCalledWith(expect.objectContaining({ create: expect.objectContaining({ trusted: true }) }));
    expect(trustChannel.send).toHaveBeenCalledWith(expect.stringContaining('welcome message to lounge'));
  });

  it('skips the greeting for long-standing members', async () => {
    setup();
    await addedVerified(member(10 * 86_400_000) as never);
    expect(lounge.send).not.toHaveBeenCalled();
    expect(trustChannel.send).toHaveBeenCalledWith(expect.stringContaining('no welcome message was sent'));
    setup({ trustChannel: null });
    await addedVerified(member(null) as never);
  });

  it('carries on when the member lookup fails', async () => {
    setup({ upsertFails: true });
    await addedVerified(member(10 * 86_400_000) as never);
    expect(dbMock.members.upsert).toHaveBeenCalledTimes(2);
  });
});

describe('trust', () => {
  const botEmbed = () => new EmbedBuilder();
  const modThread = { id: 'thread1', send: vi.fn(), setName: vi.fn() };
  const audit = { send: vi.fn() };
  const moderators = { threads: { create: vi.fn(async () => modThread) } };

  function member(opts: { threadFetch?: 'ok' | 'fail' } = {}) {
    return {
      id: 'm1',
      displayName: 'Ally',
      toString: (): string => '<@m1>',
      user: { id: 'm1' },
      guild: {
        id: 'g1',
        name: 'TripSit',
        invites: { fetch: vi.fn(async () => collectionOf({ code1: { code: 'code1', uses: 3, inviter: 'inv1' }, code2: { code: 'code2', uses: 1, inviter: null } })) },
        members: { fetch: vi.fn(async () => ({ displayName: 'Inviter' })) },
        channels: { fetch: vi.fn(async () => { if (opts.threadFetch === 'fail') throw new Error('gone'); return modThread; }) },
      },
      client: { channels: { fetch: vi.fn() } },
    };
  }

  function setup(over: { score?: number; guild?: Record<string, unknown>; modThreadId?: string | null; cached?: Array<[string, number]> } = {}) {
    (global as unknown as { guildInvites: Collection<string, Collection<string, number>> }).guildInvites = new Collection([
      ['g1', new Collection(over.cached ?? [['code1', 2]])],
    ]);
    (global as unknown as { discordClient: unknown }).discordClient = {
      channels: { fetch: vi.fn(async (id: string) => (id === 'moderators' ? moderators : audit)) },
    };
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', discord_id: 'm1', mod_thread_id: over.modThreadId === undefined ? null : over.modThreadId } as never);
    dbMock.discord_guilds.upsert.mockResolvedValue({
      id: 'g1', trust_score_limit: 3, trust_score_count: 1, trust_score_total: 2, channel_trust: 'trust', channel_moderators: 'moderators', ...over.guild,
    } as never);
    mocks.userInfoEmbed.mockResolvedValue(botEmbed());
    mocks.trustScore.mockResolvedValue({ trustScore: over.score ?? 5, tsReasoning: 'because' });
    mocks.topic.mockResolvedValue('topic');
    dbMock.members.upsert.mockResolvedValue({ trusted: false } as never);
  }

  it('records the join, trust score and invite used', async () => {
    setup({ score: 1 });
    await trust(member() as never);
    const embed = (audit.send.mock.calls[0][0] as { embeds: EmbedBuilder[] }).embeds[0];
    expect(embed.data.description).toContain('TripSit TrustScore: 1');
    expect(embed.data.footer?.text).toContain('code1-3');
    expect(dbMock.discord_guilds.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ trust_score_count: 2, trust_score_total: 3 }),
    }));
    expect(audit.send).toHaveBeenLastCalledWith(expect.stringContaining('below the set trust score'));
    expect(mocks.giveMilestone).toHaveBeenCalled();
  });

  it('falls back to the vanity url when no tracked invite was used', async () => {
    setup({ cached: [['code1', 3]], score: 1 });
    await trust(member() as never);
    expect((audit.send.mock.calls[0][0] as { embeds: EmbedBuilder[] }).embeds[0].data.footer?.text).toBe('Joined via the vanity url');
  });

  it('auto-verifies members above the trust limit', async () => {
    setup({ score: 9 });
    await trust(member() as never);
    expect(audit.send).toHaveBeenCalledWith(expect.stringContaining('above the set trust score of 3'));
  });

  it('updates the existing mod thread for returning members', async () => {
    setup({ modThreadId: 'old-thread', score: 1 });
    await trust(member() as never);
    expect(modThread.send).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('has joined the guild') }));
    expect(modThread.setName).toHaveBeenCalledWith('👋│Ally');
  });

  it('creates a new mod thread when the old one is gone', async () => {
    setup({ modThreadId: 'old-thread', score: 1 });
    await trust(member({ threadFetch: 'fail' }) as never);
    expect(moderators.threads.create).toHaveBeenCalledWith(expect.objectContaining({ name: '👋│Ally' }));
    expect(dbMock.users.update).toHaveBeenCalledWith({ where: { discord_id: 'm1' }, data: { mod_thread_id: 'thread1' } });
  });

  it('does nothing extra without a trust channel or mod channel', async () => {
    setup({ modThreadId: 'old-thread', score: 1, guild: { channel_trust: null, channel_moderators: null } });
    await trust(member({ threadFetch: 'fail' }) as never);
    expect(moderators.threads.create).not.toHaveBeenCalled();
    expect(audit.send).not.toHaveBeenCalled();
  });
});
