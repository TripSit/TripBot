/* eslint-disable no-nested-ternary, sonarjs/no-duplicate-string */
import { EmbedBuilder, GuildMember } from 'discord.js';
import { acknowledgeReportButton, refusalButton } from '../../utils/modUtils';
import { dbMock } from '../../../vitest/utils/mockDb';
import { stubInstance } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({ trustScore: vi.fn(), counts: vi.fn(), rows: vi.fn() }));
vi.mock('../../utils/trustScore', () => ({ tripSitTrustScore: mocks.trustScore, default: mocks.trustScore }));
vi.mock('../../utils/guildMemberLookup', () => ({ getDiscordMember: vi.fn() }));
vi.mock('../../utils/modHistory', () => ({ modActionCounts: mocks.counts, modHistoryRows: mocks.rows }));
vi.mock('../../../global/commands/g.last', () => ({ last: vi.fn(), default: vi.fn() }));
vi.mock('../../utils/appeal', () => ({ appealAccept: vi.fn(), appealReject: vi.fn() }));

const ID = '111111111111111111';

beforeEach(() => {
  process.env.DISCORD_GUILD_ID = 'g1';
  mocks.trustScore.mockResolvedValue({ trustScore: 3, tsReasoning: 'r' });
  mocks.counts.mockResolvedValue({});
  mocks.rows.mockReturnValue([]);
  dbMock.user_actions.findMany.mockResolvedValue([]);
  dbMock.users.upsert.mockImplementation((async (args: { where: { discord_id: string } }) => ({ id: `uid-${args.where.discord_id}`, discord_id: args.where.discord_id, mod_thread_id: null })) as never);
  dbMock.discord_guilds.upsert.mockResolvedValue({
    id: 'g1', role_moderator: 'mod-role', channel_moderators: 'modchan', channel_mod_log: 'modlog',
  } as never);
});

describe('refusalButton', () => {
  const targetMember = (over: Record<string, unknown> = {}) => stubInstance<GuildMember>(GuildMember, {
    id: ID,
    displayName: 'Rebel',
    user: { username: 'rebel', displayAvatarURL: () => 'https://av' },
    guild: { id: 'g1' },
    communicationDisabledUntilTimestamp: null,
    timeout: vi.fn(),
    toJSON: () => ({}),
    toString: (): string => '<@rebel>',
    roles: { cache: new Set() },
    ...over,
  });

  function setup(opts: { guild?: 'ok' | 'fail'; member?: 'ok' | 'left' | object; modThread?: boolean; updateFails?: boolean; timeoutFails?: boolean; lastWarningGuild?: string } = {}) {
    const rebel = opts.member === 'left' ? null : (typeof opts.member === 'object' ? opts.member as ReturnType<typeof targetMember> : targetMember());
    if (rebel && opts.timeoutFails) (rebel as unknown as { timeout: ReturnType<typeof vi.fn> }).timeout.mockRejectedValue(new Error('Missing Permissions'));
    const thread = { send: vi.fn(), setName: vi.fn() };
    const modChan = { threads: { create: vi.fn(async () => ({ id: 'newthread', send: vi.fn(), setName: vi.fn() })) } };
    const modLog = { send: vi.fn() };
    const bot = stubInstance<GuildMember>(GuildMember, {
      id: 'bot', displayName: 'TripBot', user: { username: 'tripbot', displayAvatarURL: () => 'https://av' }, guild: { id: 'g1' }, roles: { cache: new Set<string>() }, toJSON: () => ({}),
    });
    const guild = {
      id: 'g1',
      name: 'Guild',
      members: { fetch: vi.fn(async (id: string) => { if (id === 'bot') return bot; if (!rebel) throw new Error('Unknown Member'); return rebel; }) },
      channels: { fetch: vi.fn(async () => thread) },
      roles: { fetch: vi.fn(async () => ({ toString: (): string => '<@&mods>' })) },
    };
    (global as unknown as { discordClient: unknown }).discordClient = {
      user: { id: 'bot' },
      guilds: { fetch: vi.fn(async () => { if (opts.guild === 'fail') throw new Error('Unknown Guild'); return guild; }) },
      channels: { fetch: vi.fn(async (id: string) => (id === 'modlog' ? modLog : id === 'modchan' ? modChan : thread)) },
    };
    dbMock.users.upsert.mockImplementation((async (args: { where: { discord_id: string } }) => ({
      id: `uid-${args.where.discord_id}`, discord_id: args.where.discord_id, mod_thread_id: opts.modThread ? 'thread1' : null,
    })) as never);
    dbMock.user_actions.findFirst.mockResolvedValue((opts.lastWarningGuild ? { guild_id: opts.lastWarningGuild } : null) as never);
    const interaction = {
      user: { id: ID, username: 'rebel', toString: (): string => '<@rebel>' },
      message: { embeds: [new EmbedBuilder().setTitle('Warned')] },
      update: opts.updateFails ? vi.fn().mockRejectedValue(new Error('gone')) : vi.fn(),
    };
    return {
      interaction: interaction as never, raw: interaction, rebel, thread, modLog,
    };
  }

  it('times the user out for 15 minutes, records it and tells the team', async () => {
    const s = setup({ modThread: true });
    await refusalButton(s.interaction);
    expect((s.rebel as unknown as { timeout: ReturnType<typeof vi.fn> }).timeout).toHaveBeenCalledWith(900000, expect.stringContaining('rejected the warning'));
    expect(s.raw.update).toHaveBeenCalled();
    expect(dbMock.user_actions.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'TIMEOUT', guild_id: 'g1', user_id: `uid-${ID}` }) });
    expect(s.modLog.send).toHaveBeenCalled();
    expect(JSON.stringify(s.thread.send.mock.calls)).toContain('rejected');
  });

  it('creates a mod thread for first-time offenders and reports the rejection there', async () => {
    const s = setup({ modThread: false });
    await refusalButton(s.interaction);
    expect(dbMock.users.update).toHaveBeenCalled();
  });

  it('survives a failed message update and timeout failures', async () => {
    const noUpdate = setup({ updateFails: true });
    await refusalButton(noUpdate.interaction);
    expect(dbMock.user_actions.create).toHaveBeenCalled();
    dbMock.user_actions.create.mockClear();
    const noTimeout = setup({ timeoutFails: true, modThread: true });
    await refusalButton(noTimeout.interaction);
    expect(dbMock.user_actions.create).not.toHaveBeenCalled();
    expect(JSON.stringify(noTimeout.thread.send.mock.calls)).toContain('someone will need to do it manually');
    const quietFail = setup({ timeoutFails: true });
    await expect(refusalButton(quietFail.interaction)).resolves.toBeUndefined();
  });

  it('leaves users who already have a longer timeout alone', async () => {
    const longer = targetMember({ communicationDisabledUntilTimestamp: Date.now() + 7 * 86_400_000 });
    const s = setup({ member: longer, modThread: true });
    await refusalButton(s.interaction);
    expect((longer as unknown as { timeout: ReturnType<typeof vi.fn> }).timeout).not.toHaveBeenCalled();
    expect(JSON.stringify(s.raw.update.mock.calls[0][0])).toContain('Your existing timeout still expires');
    expect(JSON.stringify(s.thread.send.mock.calls)).toContain('already timed out until');
    const noThread = setup({ member: targetMember({ communicationDisabledUntilTimestamp: Date.now() + 7 * 86_400_000 }) });
    await expect(refusalButton(noThread.interaction)).resolves.toBeUndefined();
  });

  it('reports users who left the guild, or when the guild cannot be fetched', async () => {
    const left = setup({ member: 'left', modThread: true });
    await refusalButton(left.interaction);
    expect(JSON.stringify(left.raw.update.mock.calls[0][0])).toContain('the team has been told');
    expect(JSON.stringify(left.thread.send.mock.calls)).toContain('no longer in Guild');
    const noGuild = setup({ guild: 'fail', modThread: true, lastWarningGuild: 'other-guild' });
    await refusalButton(noGuild.interaction);
    expect(JSON.stringify(noGuild.thread.send.mock.calls)).toContain('no longer in the guild');
    expect(dbMock.user_actions.create).not.toHaveBeenCalled();
  });
});

describe('acknowledgeReportButton', () => {
  const REPORTER = '222222222222222222';

  function setup(opts: {
    guild?: boolean; modThread?: string | null; threadFetch?: 'ok' | 'fail'; actor?: 'ok' | 'fail'; reportee?: 'member' | 'user' | 'none';
    reporter?: 'ok' | 'left'; dmFails?: boolean; modLog?: string | null; modLogFetchFails?: boolean; editFails?: boolean; ackRow?: boolean;
  } = {}) {
    const targetChan = { name: 'thread-name', send: vi.fn() };
    const modLog = { send: vi.fn() };
    const reporter = { send: opts.dmFails ? vi.fn().mockRejectedValue(new Error('DMs closed')) : vi.fn() };
    (global as unknown as { discordClient: unknown }).discordClient = {
      channels: { fetch: vi.fn(async () => { if (opts.threadFetch === 'fail') throw new Error('Unknown'); return targetChan; }) },
      users: {
        fetch: vi.fn(async (id: string) => {
          if (id === REPORTER) { if (opts.reporter === 'left') throw new Error('Unknown User'); return reporter; }
          if (opts.reportee === 'user') return { username: 'reportee-user' };
          throw new Error('Unknown User');
        }),
      },
    };
    dbMock.users.upsert.mockResolvedValue({
      id: 'uid', username: 'dbname', mod_thread_id: opts.modThread === undefined ? 'thread1' : opts.modThread,
    } as never);
    dbMock.discord_guilds.upsert.mockResolvedValue({ id: 'g1', channel_mod_log: opts.modLog === undefined ? 'modlog' : opts.modLog } as never);
    const row = { toJSON: () => ({ components: [{ custom_id: opts.ackRow ? 'moderate~ACKN_REPORT~1~2' : 'other' }] }) };
    const message = { createdTimestamp: 1_700_000_000_000, components: [row, { toJSON: () => ({ components: [{ custom_id: 'moderate~ACKN_REPORT~1~2' }] }) }], edit: opts.editFails ? vi.fn().mockRejectedValue(new Error('gone')) : vi.fn(async () => undefined) };
    const interaction = {
      customId: `moderate~ACKN_REPORT~${ID}~${REPORTER}`,
      user: { id: 'actor', username: 'mod' },
      message,
      guild: opts.guild === false ? null : {
        id: 'g1',
        members: {
          fetch: vi.fn(async (id: string) => {
            if (id === 'actor') { if (opts.actor === 'fail') throw new Error('Unknown Member'); return { displayName: 'Mod' }; }
            if (opts.reportee === 'member') return { displayName: 'Reportee', toString: (): string => '<@reportee>' };
            throw new Error('Unknown Member');
          }),
        },
        channels: { fetch: vi.fn(async (id: string) => { if (opts.modLogFetchFails) throw new Error('x'); return id === 'modlog' ? modLog : targetChan; }) },
      },
    };
    return {
      interaction: interaction as never, targetChan, modLog, reporter, message,
    };
  }

  it('ignores DMs and reports with no mod thread', async () => {
    await acknowledgeReportButton(setup({ guild: false }).interaction);
    const none = setup({ modThread: null });
    await acknowledgeReportButton(none.interaction);
    expect(none.targetChan.send).not.toHaveBeenCalled();
    const gone = setup({ threadFetch: 'fail' });
    await acknowledgeReportButton(gone.interaction);
    expect(gone.reporter.send).not.toHaveBeenCalled();
  });

  it('stops quietly when the acting mod left', async () => {
    const s = setup({ actor: 'fail' });
    await acknowledgeReportButton(s.interaction);
    expect(s.reporter.send).not.toHaveBeenCalled();
  });

  it('thanks the reporter, records the acknowledgement and removes the button', async () => {
    const s = setup({ reportee: 'member' });
    await acknowledgeReportButton(s.interaction);
    expect(s.reporter.send).toHaveBeenCalledWith(expect.stringContaining('report on Reportee'));
    expect(JSON.stringify(s.targetChan.send.mock.calls[0][0])).toContain('Mod has acknowledged the report on <@reportee>');
    expect(s.modLog.send).toHaveBeenCalled();
    const [{ components }] = s.message.edit.mock.calls[0] as unknown as [{ components: Array<{ components: Array<{ custom_id: string }> }> }];
    expect(components.every(r => r.components.every(c => !c.custom_id.includes('ACKN_REPORT')))).toBe(true);
  });

  it('falls back to the reportee user, and to the thread name when the account is gone', async () => {
    const user = setup({ reportee: 'user' });
    await acknowledgeReportButton(user.interaction);
    expect(user.reporter.send).toHaveBeenCalledWith(expect.stringContaining('report on reportee-user'));
    const deleted = setup({ reportee: 'none' });
    await acknowledgeReportButton(deleted.interaction);
    expect(JSON.stringify(deleted.targetChan.send.mock.calls[0][0])).toContain('deleted their Discord account');
    expect(deleted.reporter.send).not.toHaveBeenCalled();
  });

  it('notes when the original reporter left', async () => {
    const s = setup({ reportee: 'member', reporter: 'left' });
    await acknowledgeReportButton(s.interaction);
    expect(JSON.stringify(s.targetChan.send.mock.calls[0][0])).toContain('original reporter of this user has left');
    const editFails = setup({ reportee: 'member', reporter: 'left', editFails: true });
    await expect(acknowledgeReportButton(editFails.interaction)).resolves.toBeUndefined();
  });

  it('handles DM failures and missing mod log channels', async () => {
    const dm = setup({ reportee: 'member', dmFails: true });
    await acknowledgeReportButton(dm.interaction);
    expect(JSON.stringify(dm.targetChan.send.mock.calls.at(-1)?.[0])).toContain('there was an error');
    const noLog = setup({ reportee: 'member', modLog: null });
    await acknowledgeReportButton(noLog.interaction);
    expect(noLog.modLog.send).not.toHaveBeenCalled();
  });
});
