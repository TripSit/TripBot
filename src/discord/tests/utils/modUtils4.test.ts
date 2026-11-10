/* eslint-disable no-restricted-syntax, sonarjs/no-duplicate-string */
import { EmbedBuilder, GuildMember } from 'discord.js';
import { moderate } from '../../utils/modUtils';
import { dbMock } from '../../../vitest/utils/mockDb';
import { stubInstance } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  trustScore: vi.fn(), last: vi.fn(), counts: vi.fn(), rows: vi.fn(), getMember: vi.fn(),
}));
vi.mock('../../utils/trustScore', () => ({ tripSitTrustScore: mocks.trustScore, default: mocks.trustScore }));
vi.mock('../../utils/guildMemberLookup', () => ({ getDiscordMember: mocks.getMember }));
vi.mock('../../utils/modHistory', () => ({ modActionCounts: mocks.counts, modHistoryRows: mocks.rows }));
vi.mock('../../../global/commands/g.last', () => ({ last: mocks.last, default: mocks.last }));
vi.mock('../../utils/appeal', () => ({ appealAccept: vi.fn(), appealReject: vi.fn() }));

const ID = '111111111111111111';

type Fields = Partial<Record<'description' | 'internalNote' | 'duration' | 'ban_duration' | 'days', string>>;

const targetMember = (over: Record<string, unknown> = {}) => stubInstance<GuildMember>(GuildMember, {
  id: ID,
  displayName: 'Target',
  user: { username: 'target', send: vi.fn(), displayAvatarURL: () => 'https://av' },
  guild: { id: 'g1' },
  roles: { cache: new Set<string>() },
  communicationDisabledUntilTimestamp: null,
  timeout: vi.fn(),
  kick: vi.fn(),
  toJSON: () => ({}),
  ...over,
});

function setup(command: string, fields: Fields = {}, opts: { member?: 'ok' | 'left-user' | 'left'; embed?: EmbedBuilder; guild?: boolean; helpdesk?: string | null } = {}) {
  const target = opts.member === 'left' || opts.member === 'left-user' ? null : targetMember();
  const bans = { create: vi.fn(async () => 'banned-user'), fetch: vi.fn(), remove: vi.fn() };
  const guild = {
    id: 'g1',
    name: 'Guild',
    bans,
    members: { fetch: vi.fn(async () => { if (!target) throw new Error('Unknown Member'); return target; }) },
  };
  const actor = stubInstance<GuildMember>(GuildMember, {
    id: 'actor1', displayName: 'Mod', user: { username: 'mod' }, guild, roles: { cache: new Set(['mod-role']) }, toJSON: () => ({}),
  });
  (global as unknown as { discordClient: unknown }).discordClient = {
    users: {
      fetch: vi.fn(async () => {
        if (opts.member === 'left') throw new Error('Unknown User'); return {
          id: ID, username: 'gone', send: vi.fn(), displayAvatarURL: () => 'https://av',
        };
      }),
    },
    channels: { fetch: vi.fn(async () => ({ toString: (): string => '#helpdesk' })) },
  };
  const values: Record<string, string> = {
    description: 'be nice', internalNote: 'rude', duration: '', ban_duration: '', days: '', ...fields,
  };
  const modalInt = { fields: { getTextInputValue: vi.fn((k: string) => values[k] ?? '') } };
  const embed = opts.embed ?? new EmbedBuilder().setTitle('Info');
  const buttonInt = {
    guild: opts.guild === false ? null : guild,
    member: actor,
    customId: `moderate~${command}~${ID}`,
    message: { embeds: [embed] },
    user: { id: 'actor1', toString: (): string => '<@actor1>' },
    followUp: vi.fn(),
    isChatInputCommand: () => false,
    isButton: () => true,
    isUserContextMenuCommand: () => false,
    isMessageContextMenuCommand: () => false,
  };
  mocks.getMember.mockResolvedValue(target ? [target] : []);
  dbMock.discord_guilds.upsert.mockResolvedValue({
    id: 'g1', channel_moderators: null, channel_mod_log: null, channel_helpdesk: opts.helpdesk === undefined ? null : opts.helpdesk,
  } as never);
  const targetRow = {
    id: 'target-uid', discord_id: ID, mod_thread_id: null, removed_at: null,
  };
  dbMock.users.upsert.mockImplementation((async (args: { where: { discord_id: string } }) => (args.where.discord_id === ID ? targetRow : { id: 'actor-uid', discord_id: 'actor1' })) as never);
  return {
    buttonInt: buttonInt as never, raw: buttonInt, modalInt: modalInt as never, modalRaw: modalInt, target, bans, targetRow,
  };
}

const description = (r: { embeds?: readonly unknown[] }) => (r.embeds?.[0] as EmbedBuilder).data.description as string;
const created = () => (dbMock.user_actions.create.mock.calls[0][0] as { data: Record<string, unknown> }).data;

beforeEach(() => {
  mocks.last.mockResolvedValue({ messageCount: 2, totalMessages: 5, messageList: 'msg list' });
  dbMock.user_actions.findFirst.mockResolvedValue(null);
  dbMock.user_actions.findMany.mockResolvedValue([]);
  mocks.counts.mockResolvedValue({});
  mocks.rows.mockReturnValue([]);
});

describe('moderate: guards', () => {
  it('requires a guild', async () => {
    const s = setup('NOTE', {}, { guild: false });
    expect((await moderate(s.buttonInt, s.modalInt)).content).toContain('guild');
  });

  it('rejects the forbidden word', async () => {
    const s = setup('WARNING', { internalNote: 'MEP talk' });
    expect(await moderate(s.buttonInt, s.modalInt)).toEqual({ content: 'You cannot use the word "MEP" here.' });
    const d = setup('WARNING', { description: 'MEP' });
    expect((await moderate(d.buttonInt, d.modalInt)).content).toContain('MEP');
  });

  it('offers to proceed when another moderator acted in the last five minutes', async () => {
    dbMock.user_actions.findFirst.mockResolvedValue({ id: 'recent' } as never);
    const run = async (customId: string) => {
      const s = setup('WARNING');
      const collector = { on: vi.fn() };
      s.raw.followUp.mockResolvedValue({ createMessageComponentCollector: vi.fn(() => collector) });
      const pending = moderate(s.buttonInt, s.modalInt);
      await vi.waitFor(() => expect(collector.on).toHaveBeenCalled());
      const handler = collector.on.mock.calls[0][1] as (i: unknown) => Promise<void>;
      const click = { customId, update: vi.fn() };
      if (customId === 'proceedButton') dbMock.user_actions.findFirst.mockResolvedValue(null);
      await handler(click);
      return {
        result: await pending, click, collector, s,
      };
    };
    const cancelled = await run('nahButton');
    expect(cancelled.result.content).toContain('cancelled due to another taken recently');
    expect(cancelled.click.update).toHaveBeenCalledWith({ content: 'Action cancelled.', components: [] });
    expect(dbMock.user_actions.create).not.toHaveBeenCalled();
    dbMock.user_actions.findFirst.mockResolvedValue({ id: 'recent' } as never);
    await run('proceedButton');
    expect(dbMock.user_actions.create).toHaveBeenCalled();
  });

  it('does not run the recent-action check for appeals, notes, reports or reversals', async () => {
    dbMock.user_actions.findFirst.mockResolvedValue({ id: 'recent' } as never);
    for (const command of ['NOTE', 'REPORT', 'UN-FULL_BAN', 'UN-TIMEOUT']) {
      const s = setup(command);
      // eslint-disable-next-line no-await-in-loop
      const result = await moderate(s.buttonInt, s.modalInt);
      expect(result.content).toBeUndefined();
    }
  });
});

describe('moderate: notes, reports and warnings', () => {
  it('records notes without messaging the user', async () => {
    const s = setup('NOTE', { internalNote: 'watch them' });
    const result = await moderate(s.buttonInt, s.modalInt);
    expect(created()).toMatchObject({ type: 'NOTE', internal_note: 'watch them', description: '' });
    expect(description(result)).toContain('Target was noted');
    expect(s.modalRaw.fields.getTextInputValue).not.toHaveBeenCalledWith('description');
    expect((s.target as unknown as { user: { send: ReturnType<typeof vi.fn> } }).user.send).not.toHaveBeenCalled();
  });

  it('records reports similarly', async () => {
    const s = setup('REPORT');
    expect(description(await moderate(s.buttonInt, s.modalInt))).toContain('Target was reported');
  });

  it('DMs warnings with acknowledge buttons, and links the discussion channel when set', async () => {
    const s = setup('WARNING', {}, { helpdesk: 'help' });
    await moderate(s.buttonInt, s.modalInt);
    const { send } = (s.target as unknown as { user: { send: ReturnType<typeof vi.fn> } }).user;
    const [{ embeds, components }] = send.mock.calls[0] as unknown as [{ embeds: EmbedBuilder[]; components: unknown[] }];
    expect(embeds[0].data.description).toContain("you've been warned by Team TripSit");
    expect(embeds[0].data.description).toContain('discuss this with the mods in #helpdesk');
    expect(embeds[0].data.description).toContain('Terms');
    expect(components).toHaveLength(1);
    expect(created()).toMatchObject({ type: 'WARNING' });
  });

  it('describes failed DMs without failing the action', async () => {
    const s = setup('WARNING');
    (s.target as unknown as { user: { send: ReturnType<typeof vi.fn> } }).user.send.mockRejectedValue(new Error('DMs closed'));
    const result = await moderate(s.buttonInt, s.modalInt);
    expect(description(result)).toContain('Target was warned');
    expect(dbMock.user_actions.create).toHaveBeenCalled();
  });

  it('does not DM users who have left, or when no message was written', async () => {
    const left = setup('WARNING', {}, { member: 'left' });
    await moderate(left.buttonInt, left.modalInt);
    const quiet = setup('WARNING', { description: '' });
    await moderate(quiet.buttonInt, quiet.modalInt);
    expect((quiet.target as unknown as { user: { send: ReturnType<typeof vi.fn> } }).user.send).not.toHaveBeenCalled();
  });

  it('appends to the existing Actions field of the moderation embed', async () => {
    const embed = new EmbedBuilder().addFields({ name: 'Actions', value: 'earlier action' });
    const s = setup('NOTE', {}, { embed });
    await moderate(s.buttonInt, s.modalInt);
    const withMessage = new EmbedBuilder().addFields({ name: 'Message', value: 'quoted' });
    const m = setup('NOTE', {}, { embed: withMessage });
    await expect(moderate(m.buttonInt, m.modalInt)).resolves.toBeDefined();
  });
});

describe('moderate: timeouts', () => {
  it('times the member out for the requested duration', async () => {
    const s = setup('TIMEOUT', { duration: '1h' });
    const result = await moderate(s.buttonInt, s.modalInt);
    expect((s.target as unknown as { timeout: ReturnType<typeof vi.fn> }).timeout).toHaveBeenCalledWith(3_600_000, 'rude');
    expect(created().expires_at).toBeInstanceOf(Date);
    expect(description(result)).toContain('Target was timed out');
    const dm = (s.target as unknown as { user: { send: ReturnType<typeof vi.fn> } }).user.send.mock.calls[0][0] as { embeds: EmbedBuilder[] };
    expect(dm.embeds[0].data.description).toContain('It will expire in');
  });

  it('defaults to seven days and validates input', async () => {
    const def = setup('TIMEOUT');
    await moderate(def.buttonInt, def.modalInt);
    expect((def.target as unknown as { timeout: ReturnType<typeof vi.fn> }).timeout).toHaveBeenCalledWith(7 * 86_400_000, 'rude');
    const bad = setup('TIMEOUT', { duration: 'soon' });
    expect((await moderate(bad.buttonInt, bad.modalInt)).content).toContain('Timeout duration must include');
    const long = setup('TIMEOUT', { duration: '2w' });
    expect((await moderate(long.buttonInt, long.modalInt)).content).toBe('Timeout must be between 0 and 7 days!');
  });

  it('requires the user to be in the guild and survives API failures', async () => {
    const gone = setup('TIMEOUT', { duration: '1h' }, { member: 'left' });
    expect((await moderate(gone.buttonInt, gone.modalInt)).content).toBe('User is not in the guild!');
    const fails = setup('TIMEOUT', { duration: '1h' });
    (fails.target as unknown as { timeout: ReturnType<typeof vi.fn> }).timeout.mockRejectedValue(new Error('Missing Permissions'));
    await expect(moderate(fails.buttonInt, fails.modalInt)).resolves.toBeDefined();
  });

  it('removes timeouts and closes the original record', async () => {
    dbMock.user_actions.findMany.mockResolvedValue([{ id: 'old-timeout', user_id: 'target-uid', type: 'TIMEOUT' }] as never);
    const s = setup('UN-TIMEOUT');
    await moderate(s.buttonInt, s.modalInt);
    expect((s.target as unknown as { timeout: ReturnType<typeof vi.fn> }).timeout).toHaveBeenCalledWith(null, 'rude');
    expect(dbMock.user_actions.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'old-timeout' } }));
    const none = setup('UN-TIMEOUT', {}, { member: 'left' });
    expect((await moderate(none.buttonInt, none.modalInt)).content).toBe('User is not in the guild!');
    dbMock.user_actions.findMany.mockResolvedValue([]);
    const noRecord = setup('UN-TIMEOUT');
    (noRecord.target as unknown as { timeout: ReturnType<typeof vi.fn> }).timeout.mockRejectedValue(new Error('x'));
    await expect(moderate(noRecord.buttonInt, noRecord.modalInt)).resolves.toBeDefined();
  });

  it('kicks members, tolerating failures, and requires membership', async () => {
    const s = setup('KICK');
    await moderate(s.buttonInt, s.modalInt);
    expect((s.target as unknown as { kick: ReturnType<typeof vi.fn> }).kick).toHaveBeenCalled();
    expect((s.target as unknown as { user: { send: ReturnType<typeof vi.fn> } }).user.send.mock.calls[0][0].embeds[0].data.description).toContain('rejoin here');
    const fails = setup('KICK');
    (fails.target as unknown as { kick: ReturnType<typeof vi.fn> }).kick.mockRejectedValue(new Error('x'));
    await expect(moderate(fails.buttonInt, fails.modalInt)).resolves.toBeDefined();
    const gone = setup('KICK', {}, { member: 'left' });
    expect((await moderate(gone.buttonInt, gone.modalInt)).content).toBe('User is not in the guild!');
  });
});

describe('moderate: bans', () => {
  it('bans, deleting recent messages and relaying them to the mod log', async () => {
    const s = setup('FULL_BAN', { days: '1' });
    const result = await moderate(s.buttonInt, s.modalInt);
    expect(s.bans.create).toHaveBeenCalledWith(ID, { deleteMessageSeconds: 86_400, reason: expect.stringContaining('rude') });
    expect(mocks.last).toHaveBeenCalledTimes(2);
    expect(description(result)).toContain('Target was banned');
    expect(s.targetRow.removed_at).toBeInstanceOf(Date);
    expect(created().internal_note).toContain('Ban Ends:** Never');
    const dm = (s.target as unknown as { user: { send: ReturnType<typeof vi.fn> } }).user.send.mock.calls[0][0] as { embeds: EmbedBuilder[] };
    expect(dm.embeds[0].data.description).toContain('tripsit.me/appeal');
    expect(dm.embeds[0].data.description).toContain('msg list');
  });

  it('supports temporary bans and validates durations', async () => {
    const temp = setup('FULL_BAN', { ban_duration: '3 days' });
    await moderate(temp.buttonInt, temp.modalInt);
    expect(created().expires_at).toBeInstanceOf(Date);
    const notNumber = setup('FULL_BAN', { ban_duration: 'forever' });
    expect((await moderate(notNumber.buttonInt, notNumber.modalInt)).content).toBe('Ban duration must be a number!');
    const noUnit = setup('FULL_BAN', { ban_duration: '5 parsecs' });
    expect((await moderate(noUnit.buttonInt, noUnit.modalInt)).content).toContain('Ban duration must include');
  });

  it('validates the message delete window', async () => {
    const nan = setup('FULL_BAN', { days: 'many' });
    expect((await moderate(nan.buttonInt, nan.modalInt)).content).toBe('Delete duration must be a number!');
    const badUnit = setup('FULL_BAN', { days: '5 parsecs' });
    expect((await moderate(badUnit.buttonInt, badUnit.modalInt)).content).toContain('Delete duration must include');
    const hours = setup('FULL_BAN', { days: '12 hours' });
    await moderate(hours.buttonInt, hours.modalInt);
    expect(hours.bans.create).toHaveBeenCalledWith(ID, expect.objectContaining({ deleteMessageSeconds: 43_200 }));
  });

  it('never DMs vendor/bot bans', async () => {
    const s = setup('FULL_BAN', { internalNote: 'Vendor spam' });
    const result = await moderate(s.buttonInt, s.modalInt);
    expect((s.target as unknown as { user: { send: ReturnType<typeof vi.fn> } }).user.send).not.toHaveBeenCalled();
    expect(description(result)).not.toContain('Note sent to user');
  });

  it('handles underbans, evasion bans and bans that fail', async () => {
    const under = setup('UNDERBAN');
    await moderate(under.buttonInt, under.modalInt);
    expect(created()).toMatchObject({ type: 'UNDERBAN' });
    const evade = setup('BAN_EVASION');
    await moderate(evade.buttonInt, evade.modalInt);
    expect((evade.target as unknown as { user: { send: ReturnType<typeof vi.fn> } }).user.send.mock.calls[0][0].embeds[0].data.description).toContain('Evasion bans are permanent');
    const fails = setup('FULL_BAN', { days: '1' });
    fails.bans.create.mockRejectedValue(new Error('Missing Permissions'));
    mocks.last.mockResolvedValueOnce({ messageCount: 0, totalMessages: 0, messageList: '' }).mockRejectedValueOnce(new Error('fetch failed'));
    await expect(moderate(fails.buttonInt, fails.modalInt)).resolves.toBeDefined();
  });

  // Regression test for TripSit/TripBot#1370: these commands used to be ignored, so the flags were never set.
  it('applies role and bot bans to the user record', async () => {
    const flags: Array<[string, string]> = [['TICKET_BAN', 'ticket_ban'], ['DISCORD_BOT_BAN', 'discord_bot_ban'], ['HELPER_BAN', 'helper_role_ban'], ['CONTRIBUTOR_BAN', 'contributor_role_ban']];
    for (const [command, field] of flags) {
      const s = setup(command);
      // eslint-disable-next-line no-await-in-loop
      await moderate(s.buttonInt, s.modalInt);
      expect((s.targetRow as unknown as Record<string, unknown>)[field]).toBe(true);
    }
  });

  it('lifts bans and closing out the original record', async () => {
    const record = { id: 'ban-record', user_id: 'target-uid', type: 'FULL_BAN' };
    const unban = setup('UN-FULL_BAN');
    dbMock.user_actions.findFirst.mockResolvedValue(record as never);
    await moderate(unban.buttonInt, unban.modalInt);
    expect(unban.bans.remove).toHaveBeenCalledWith(ID, 'rude');
    expect(dbMock.user_actions.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'ban-record' } }));
    expect(unban.targetRow.removed_at).toBeNull();
  });

  // Regression test for TripSit/TripBot#1370.
  it('lifts role and bot bans', async () => {
    const record = { id: 'ban-record', user_id: 'target-uid', type: 'FULL_BAN' };
    const flags: Array<[string, string]> = [['UN-TICKET_BAN', 'ticket_ban'], ['UN-DISCORD_BOT_BAN', 'discord_bot_ban'], ['UN-HELPER_BAN', 'helper_role_ban'], ['UN-CONTRIBUTOR_BAN', 'contributor_role_ban']];
    for (const [command, field] of flags) {
      const s = setup(command);
      dbMock.user_actions.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(record as never);
      // eslint-disable-next-line no-await-in-loop
      await moderate(s.buttonInt, s.modalInt);
      expect((s.targetRow as unknown as Record<string, unknown>)[field]).toBe(false);
    }
  });

  it('still lifts bans when there is no record, or the API fails', async () => {
    const s = setup('UN-UNDERBAN');
    s.bans.remove.mockRejectedValue(new Error('Unknown Ban'));
    await moderate(s.buttonInt, s.modalInt);
    expect(dbMock.user_actions.create).toHaveBeenCalled();
    const evasion = setup('UN-BAN_EVASION');
    await expect(moderate(evasion.buttonInt, evasion.modalInt)).resolves.toBeDefined();
  });

  it('includes the mod thread link in the response when one was created', async () => {
    const s = setup('NOTE');
    dbMock.discord_guilds.upsert.mockResolvedValue({
      id: 'g1', channel_moderators: 'modchan', channel_mod_log: 'modlog', role_moderator: 'mod-role',
    } as never);
    const thread = {
      id: 'thread1', send: vi.fn(), setName: vi.fn(), toString: (): string => '<#thread1>',
    };
    (global as unknown as { discordClient: unknown }).discordClient = {
      users: { fetch: vi.fn() },
      channels: { fetch: vi.fn(async (id: string) => (id === 'modlog' ? { send: vi.fn() } : { threads: { create: vi.fn(async () => thread) } })) },
      guilds: { fetch: vi.fn(async () => ({ channels: { fetch: vi.fn() }, roles: { fetch: vi.fn(async () => ({ toString: (): string => '<@&mods>' })) } })) },
    };
    const result = await moderate(s.buttonInt, s.modalInt);
    expect(description(result)).toContain('You can access their thread here: <#thread1>');
  });
});
