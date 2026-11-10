/* eslint-disable sonarjs/no-nested-template-literals */
import { EmbedBuilder, GuildMember } from 'discord.js';
import { modModal } from '../../utils/modUtils';
import { dbMock } from '../../../vitest/utils/mockDb';
import { stubInstance } from '../../../vitest/utils/discordStubs';

const e = env as unknown as Record<string, string>;
const mocks = vi.hoisted(() => ({
  trustScore: vi.fn(), counts: vi.fn(), rows: vi.fn(), getMember: vi.fn(), appealAccept: vi.fn(), appealReject: vi.fn(),
}));
vi.mock('../../utils/trustScore', () => ({ tripSitTrustScore: mocks.trustScore, default: mocks.trustScore }));
vi.mock('../../utils/guildMemberLookup', () => ({ getDiscordMember: mocks.getMember }));
vi.mock('../../utils/modHistory', () => ({ modActionCounts: mocks.counts, modHistoryRows: mocks.rows }));
vi.mock('../../../global/commands/g.last', () => ({ last: vi.fn(), default: vi.fn() }));
vi.mock('../../utils/appeal', () => ({ appealAccept: mocks.appealAccept, appealReject: mocks.appealReject }));

const ID = '111111111111111111';

type Opts = {
  variant?: string; guild?: boolean; memberFetch?: 'ok' | 'fail'; userFetch?: 'ok' | 'fail'; fields?: Array<{ name: string; value: string }>;
  ackRow?: boolean; submitId?: string; submitFails?: boolean | string; editFails?: boolean;
};

function setup(command: string, opts: Opts = {}) {
  const target = stubInstance<GuildMember>(GuildMember, {
    id: ID,
    displayName: 'Target',
    user: { username: 'target', send: vi.fn(), displayAvatarURL: () => 'https://av' },
    guild: { id: 'g1' },
    roles: { cache: new Set<string>() },
    communicationDisabledUntilTimestamp: null,
    toJSON: () => ({}),
  });
  const embed = new EmbedBuilder().setTitle('Info');
  if (opts.fields?.length) embed.addFields(opts.fields);
  const buttonRow = (id: string) => ({
    toJSON: () => ({
      type: 1,
      components: [{
        type: 2, custom_id: id, label: 'x', style: 1,
      }],
    }),
  });
  const rows = [buttonRow(command === 'ACKN_REPORT' ? 'other~NOTE~x' : `moderate~${command}~${ID}`)];
  if (opts.ackRow) rows.push(buttonRow(`moderate~ACKN_REPORT~${ID}~222`));
  const actor = stubInstance<GuildMember>(GuildMember, {
    id: 'actor1',
    displayName: 'Mod',
    user: { username: 'mod' },
    roles: { cache: new Set(['mod-role']) },
    toJSON: () => ({}),
    guild: { id: 'g1' },
  });
  const modalValues: Record<string, string> = {
    internalNote: 'reason', description: 'text', appealDescription: 'appeal text', duration: '', ban_duration: '', days: '',
  };
  const submit = {
    customId: `modModal~${command}~${opts.submitId ?? 'int1'}`,
    deferReply: vi.fn(),
    editReply: vi.fn(),
    fields: { getTextInputValue: vi.fn((k: string) => modalValues[k] ?? '') },
  };
  const guild = {
    id: 'g1',
    name: 'Guild',
    bans: { fetch: vi.fn(), create: vi.fn(), remove: vi.fn() },
    members: { fetch: vi.fn(async () => { if (opts.memberFetch === 'fail') throw new Error('Unknown Member'); return target; }) },
    roles: { fetch: vi.fn(async () => ({ toString: (): string => '<@&mods>' })) },
  };
  Object.defineProperty(actor, 'guild', { value: guild, configurable: true, writable: true });
  const interaction = {
    id: 'int1',
    customId: `moderate~${command}~${ID}${opts.variant ? `~${opts.variant}` : ''}`,
    guild: opts.guild === false ? null : guild,
    member: actor,
    user: { id: 'actor1', toString: (): string => '<@actor1>' },
    message: {
      embeds: [embed], components: rows, channelId: 'thread-chan', edit: opts.editFails ? vi.fn().mockRejectedValue(new Error('ephemeral')) : vi.fn(),
    },
    deferReply: vi.fn(),
    editReply: vi.fn(),
    showModal: vi.fn(),
    isChatInputCommand: () => false,
    isButton: () => true,
    isUserContextMenuCommand: () => false,
    isMessageContextMenuCommand: () => false,
    awaitModalSubmit: opts.submitFails
      ? vi.fn().mockRejectedValue(new Error(typeof opts.submitFails === 'string' ? opts.submitFails : 'Collector received no interactions before ending with reason: time'))
      : vi.fn(async () => submit),
  };
  (global as unknown as { discordClient: unknown }).discordClient = {
    users: { fetch: vi.fn(async () => { if (opts.userFetch === 'fail') throw new Error('Unknown User'); return { id: ID, username: 'gone', displayAvatarURL: () => 'https://av' }; }) },
    channels: { fetch: vi.fn(async () => ({ send: vi.fn(), toString: (): string => '#c' })) },
    guilds: { fetch: vi.fn() },
  };
  mocks.getMember.mockResolvedValue([target]);
  dbMock.discord_guilds.upsert.mockResolvedValue({ id: 'g1', channel_moderators: null, channel_mod_log: null } as never);
  dbMock.users.upsert.mockImplementation((async (args: { where: { discord_id: string } }) => ({ id: `uid-${args.where.discord_id}`, discord_id: args.where.discord_id, mod_thread_id: null })) as never);
  return {
    interaction: interaction as never, raw: interaction, submit, target,
  };
}

const modalJson = (s: ReturnType<typeof setup>) => JSON.stringify(s.raw.showModal.mock.calls[0][0]);

beforeEach(() => {
  mocks.trustScore.mockResolvedValue({ trustScore: 3, tsReasoning: 'r' });
  mocks.counts.mockResolvedValue({});
  mocks.rows.mockReturnValue([]);
  dbMock.user_actions.findFirst.mockResolvedValue(null);
  dbMock.user_actions.findMany.mockResolvedValue([]);
});

describe('modModal: non-modal actions', () => {
  it('ignores DMs', async () => {
    const s = setup('NOTE', { guild: false });
    await modModal(s.interaction);
    expect(s.raw.showModal).not.toHaveBeenCalled();
  });

  it('shows the user info embed for INFO, falling back to a user or id', async () => {
    const s = setup('INFO');
    await modModal(s.interaction);
    expect(s.raw.deferReply).toHaveBeenCalledWith({ flags: 64 });
    expect((s.raw.editReply.mock.calls[0][0] as { embeds: unknown[] }).embeds).toHaveLength(1);
    const noMember = setup('INFO', { memberFetch: 'fail' });
    await modModal(noMember.interaction);
    expect(noMember.raw.editReply).toHaveBeenCalled();
    const nobody = setup('INFO', { memberFetch: 'fail', userFetch: 'fail' });
    await modModal(nobody.interaction);
    expect(nobody.raw.editReply).toHaveBeenCalled();
  });

  it('acknowledges reports once, then reports they were already acknowledged', async () => {
    const already = setup('ACKN_REPORT');
    await modModal(already.interaction);
    expect(JSON.stringify(already.raw.editReply.mock.calls[0][0])).toContain('already been acknowledged');
    const first = setup('ACKN_REPORT', { ackRow: true });
    first.raw.guild = null as never;
    await expect(modModal(first.interaction)).resolves.toBeUndefined();
  });
});

describe('modModal: building the modal', () => {
  it.each([
    ['NOTE', 'noting'], ['REPORT', 'reporting'], ['WARNING', 'warning'], ['KICK', 'kicking'], ['TIMEOUT', 'timing out'], ['FULL_BAN', 'banning'],
    ['TICKET_BAN', 'ticket banning'], ['DISCORD_BOT_BAN', 'discord bot'], ['BAN_EVASION', 'evasion'], ['UNDERBAN', 'underbanning'],
    ['CONTRIBUTOR_BAN', 'Contributor'], ['HELPER_BAN', 'Helper'], ['UN-HELPER_BAN', 'allowing Helper'], ['UN-CONTRIBUTOR_BAN', 'allowing Contributor'],
    ['UN-TIMEOUT', 'removing timeout'], ['UN-FULL_BAN', 'removing ban'], ['UN-TICKET_BAN', 'ticket ban'], ['UN-DISCORD_BOT_BAN', 'bot ban'],
    ['UN-BAN_EVASION', 'evasion'], ['UN-UNDERBAN', 'underban'], ['APPEAL_ACCEPT', 'approving'], ['APPEAL_REJECT', 'rejecting'],
  ])('labels %s modals with "%s"', async (command, verb) => {
    const s = setup(command, { submitFails: 'something else' });
    await modModal(s.interaction);
    expect(modalJson(s)).toContain(verb);
    expect(s.raw.message.edit).toHaveBeenCalled();
  });

  it('adds the right inputs for each command type', async () => {
    const warn = setup('WARNING', { submitFails: 'x' });
    await modModal(warn.interaction);
    expect(modalJson(warn)).toContain('"custom_id":"description"');
    const note = setup('NOTE', { submitFails: 'x' });
    await modModal(note.interaction);
    expect(modalJson(note)).not.toContain('"custom_id":"description"');
    const timeout = setup('TIMEOUT', { submitFails: 'x' });
    await modModal(timeout.interaction);
    expect(modalJson(timeout)).toContain('"custom_id":"duration"');
    const ban = setup('FULL_BAN', { submitFails: 'x' });
    await modModal(ban.interaction);
    expect(modalJson(ban)).toContain('"custom_id":"ban_duration"');
    expect(modalJson(ban)).toContain('"custom_id":"days"');
    const appeal = setup('APPEAL_ACCEPT', { submitFails: 'x' });
    await modModal(appeal.interaction);
    expect(modalJson(appeal)).toContain('appealDescription');
    expect(modalJson(appeal)).toContain('Welcome back to TripSit');
    const reject = setup('APPEAL_REJECT', { submitFails: 'x' });
    await modModal(reject.interaction);
    expect(modalJson(reject)).toContain('unfortunately denied');
  });

  it('prefills vendor/bot bans', async () => {
    const s = setup('FULL_BAN', { variant: 'vendorbot', submitFails: 'x' });
    await modModal(s.interaction);
    expect(modalJson(s)).toContain('Suspected vendor / bot');
    expect(modalJson(s)).toContain('1 day');
  });

  it('prefills reasons from flagged and quoted messages', async () => {
    const flagged = setup('FULL_BAN', {
      submitFails: 'x',
      fields: [{ name: 'Flags', value: 'hate' }, { name: 'Message', value: 'bad text\n- https://discord.com/channels/1/2/3' }, { name: 'Channel', value: '#general' }],
    });
    await modModal(flagged.interaction);
    expect(modalJson(flagged)).toContain("breaks Guild's policies");
    const note = setup('NOTE', { submitFails: 'x', fields: [{ name: 'Flags', value: 'spam' }] });
    await modModal(note.interaction);
    expect(modalJson(note)).toContain('flagged by the AI for spam');
    const plain = setup('WARNING', { submitFails: 'x', fields: [{ name: 'Message', value: 'no url here' }] });
    await modModal(plain.interaction);
    expect(modalJson(plain)).toContain('no url here');
  });

  it('truncates long labels', async () => {
    const s = setup('UN-CONTRIBUTOR_BAN', { submitFails: 'x', memberFetch: 'fail', userFetch: 'fail' });
    await modModal(s.interaction);
    const label = /"label":"(Why are you[^"]*)"/.exec(modalJson(s))?.[1] ?? '';
    expect(label.length).toBeGreaterThan(0);
    expect(label.length).toBeLessThanOrEqual(45);
  });

  it('opens the modal even when the original message cannot be edited, and falls back to a user name', async () => {
    const s = setup('NOTE', { submitFails: 'x', editFails: true, memberFetch: 'fail' });
    await modModal(s.interaction);
    expect(s.raw.showModal).toHaveBeenCalled();
  });
});

describe('modModal: submissions', () => {
  it('records notes and reports, thanking the submitter', async () => {
    const note = setup('NOTE');
    await modModal(note.interaction);
    expect(note.submit.deferReply).toHaveBeenCalled();
    expect(JSON.stringify(note.submit.editReply.mock.calls.at(-1)?.[0])).toContain('Your note was added!');
    expect(dbMock.user_actions.create).toHaveBeenCalled();
    dbMock.user_actions.create.mockClear();
    const report = setup('REPORT');
    await modModal(report.interaction);
    expect(JSON.stringify(report.submit.editReply.mock.calls.at(-1)?.[0])).toContain('Your report was sent!');
  });

  it('runs other actions through moderate and replies with its result', async () => {
    const s = setup('WARNING');
    await modModal(s.interaction);
    expect(JSON.stringify(s.submit.editReply.mock.calls.at(-1)?.[0])).toContain('was warned');
    expect(s.raw.message.edit).toHaveBeenCalled();
  });

  it('ignores submissions from other modals', async () => {
    const s = setup('WARNING', { submitId: 'other' });
    await modModal(s.interaction);
    expect(s.submit.deferReply).not.toHaveBeenCalled();
  });

  it('re-enables the button when the modal times out, and ignores other errors', async () => {
    const timeout = setup('WARNING', { submitFails: true });
    await modModal(timeout.interaction);
    expect(timeout.raw.message.edit).toHaveBeenCalledTimes(2);
    const other = setup('WARNING', { submitFails: 'weird failure' });
    await modModal(other.interaction);
    expect(other.raw.message.edit).toHaveBeenCalledTimes(1);
    const editFails = setup('WARNING', { submitFails: true, editFails: true });
    await expect(modModal(editFails.interaction)).resolves.toBeUndefined();
  });

  describe('ban appeals', () => {
    const run = async (command: 'APPEAL_ACCEPT' | 'APPEAL_REJECT', result: { content: string }) => {
      mocks.appealAccept.mockResolvedValue(result);
      mocks.appealReject.mockResolvedValue(result);
      const s = setup(command);
      const thread = { send: vi.fn() };
      const modLog = { send: vi.fn() };
      (global as unknown as { discordClient: { channels: { fetch: unknown } } }).discordClient.channels.fetch = vi.fn(async (id: string) => (id === e.CHANNEL_MODLOG ? modLog : thread));
      await modModal(s.interaction);
      return { s, thread, modLog };
    };

    it('logs accepted appeals to the thread and the mod log', async () => {
      const { s, thread, modLog } = await run('APPEAL_ACCEPT', { content: '<@1> has been unbanned and their appeal approved.' });
      expect(dbMock.user_actions.create).toHaveBeenCalledWith({ data: expect.objectContaining({ type: 'APPEAL_ACCEPT', target_discord_id: ID }) });
      expect(JSON.stringify(thread.send.mock.calls[0][0])).toContain('has accepted this appeal');
      expect(JSON.stringify(modLog.send.mock.calls[0][0])).toContain('accepted an appeal');
      expect(s.submit.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('unbanned') });
    });

    it('logs rejected appeals', async () => {
      const { thread } = await run('APPEAL_REJECT', { content: "<@1>'s appeal has been rejected." });
      expect(JSON.stringify(thread.send.mock.calls[0][0])).toContain('has rejected this appeal');
    });

    it('only replies when the appeal update failed', async () => {
      const { s, thread } = await run('APPEAL_ACCEPT', { content: 'No appeal found for this user.' });
      expect(thread.send).not.toHaveBeenCalled();
      expect(dbMock.user_actions.create).not.toHaveBeenCalled();
      expect(s.submit.editReply).toHaveBeenCalledWith({ content: 'No appeal found for this user.' });
    });
  });
});
