import { GuildMember } from 'discord.js';
import {
  modButtonAcknowledgeReport, modButtonApproveAppeal, modButtonBan, modButtonBanVendorBot, modButtonInfo, modButtonNote,
  modButtonRejectAppeal, modButtonReport, modButtonTimeout, modButtonUnBan, modButtonUnTimeout, modButtonWarn,
  msToHuman, userInfoEmbed,
} from '../../utils/modUtils';
import { dbMock } from '../../../vitest/utils/mockDb';
import { stubInstance } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({ trustScore: vi.fn() }));
vi.mock('../../utils/trustScore', () => ({ tripSitTrustScore: mocks.trustScore, default: mocks.trustScore }));
vi.mock('../../../global/commands/g.last', () => ({ last: vi.fn(), default: vi.fn() }));

describe('msToHuman', () => {
  it.each([
    [0, ''],
    [1000, '1 seconds'],
    [61_000, '1 minutes 1 seconds'],
    [3_600_000, '1 hours'],
    [90_061_000, '1 days 1 hours 1 minutes 1 seconds'],
    [2 * 86_400_000, '2 days'],
  ])('formats %d ms as %j', (ms, expected) => {
    expect(msToHuman(ms)).toBe(expected);
  });
});

describe('moderation buttons', () => {
  const json = (b: { toJSON(): unknown }) => b.toJSON() as { custom_id: string; label: string; style: number };

  it.each([
    [modButtonNote('1'), 'moderate~NOTE~1', 'Note'],
    [modButtonInfo('1'), 'moderate~INFO~1', 'Info'],
    [modButtonReport('1'), 'moderate~REPORT~1', 'Report'],
    [modButtonWarn('1'), 'moderate~WARNING~1', 'Warn'],
    [modButtonTimeout('1'), 'moderate~TIMEOUT~1', 'Mute'],
    [modButtonBan('1'), 'moderate~FULL_BAN~1', 'Ban'],
    [modButtonBanVendorBot('1'), 'moderate~FULL_BAN~1~vendorbot', 'Vendor / Bot'],
    [modButtonUnBan('1'), 'moderate~UN-FULL_BAN~1', 'Unban'],
    [modButtonUnTimeout('1'), 'moderate~UN-TIMEOUT~1', 'Unmute'],
    [modButtonApproveAppeal('1'), 'moderate~APPEAL_ACCEPT~1', 'Approve'],
    [modButtonRejectAppeal('1'), 'moderate~APPEAL_REJECT~1', 'Deny'],
    [modButtonAcknowledgeReport('1', '2'), 'moderate~ACKN_REPORT~1~2', 'Acknowledge'],
  ])('builds button %#', (button, id, label) => {
    expect(json(button)).toMatchObject({ custom_id: id, label });
  });
});

describe('userInfoEmbed', () => {
  const targetData = (over: Record<string, unknown> = {}) => ({ id: 'uid', mod_thread_id: null, ...over }) as never;
  const actions = [
    { type: 'NOTE', created_at: new Date('2024-01-01'), internal_note: 'a note' },
    { type: 'NOTE', created_at: new Date('2024-01-02'), internal_note: null },
    { type: 'WARNING', created_at: new Date('2024-01-03'), internal_note: 'warned' },
    { type: 'REPORT', created_at: new Date('2024-01-04'), internal_note: 'reported' },
    { type: 'TIMEOUT', created_at: new Date('2024-01-05'), internal_note: 'muted' },
    { type: 'KICK', created_at: new Date('2024-01-06'), internal_note: 'kicked' },
    { type: 'FULL_BAN', created_at: new Date('2024-01-07'), internal_note: 'banned' },
    { type: 'UNDERBAN', created_at: new Date('2024-01-08'), internal_note: 'young' },
  ];
  const member = (over: Record<string, unknown> = {}) => stubInstance<GuildMember>(GuildMember, {
    id: '111111111111111111', displayName: 'Ally', user: { username: 'ally', displayAvatarURL: () => 'https://av' }, guild: { id: 'g1' }, toJSON: () => ({}), ...over,
  });
  const actor = () => ({ displayName: 'Mod', user: { username: 'mod' }, guild: { id: 'g1' } }) as never;

  beforeEach(() => {
    dbMock.user_actions.findMany.mockResolvedValue(actions as never);
    mocks.trustScore.mockResolvedValue({ trustScore: 4, tsReasoning: 'reasons' });
  });

  it('summarises action counts and the mod thread link for moderators', async () => {
    const embed = await userInfoEmbed(actor(), member(), targetData({ mod_thread_id: 'thread9' }), 'NOTE', true);
    const names = (embed.data.fields ?? []).map(f => f.name);
    expect(names).toEqual(['# of Notes', '# of Warns', '# of Reports', '# of Timeouts', '# of Kicks', '# of Bans', '# of Underbans']);
    expect(embed.data.description).toContain('Report <@111111111111111111>');
    expect(embed.data.description).toContain('https://discord.com/channels/g1/thread9');
    expect(embed.data.thumbnail?.url).toBe('https://av');
  });

  it('adds the history and trust score for INFO requests', async () => {
    const embed = await userInfoEmbed(actor(), member(), targetData(), 'INFO', true);
    expect(embed.data.description).toContain('**Bans**');
    expect(embed.data.description).toContain('a note');
    expect(embed.data.description).toContain('No note provided');
    expect(embed.data.description).toContain('**TripSit TrustScore: 4**');
    expect(mocks.trustScore).toHaveBeenCalledWith('111111111111111111');
  });

  it('shows a clean record message and a plain thread mention without an actor guild', async () => {
    dbMock.user_actions.findMany.mockResolvedValue([]);
    const clean = await userInfoEmbed({ displayName: '', user: { username: 'mod' } } as never, 'someid', targetData({ mod_thread_id: 't1' }), 'INFO', true);
    expect(clean.data.description).toContain('<#t1>');
    expect(clean.data.description).toContain('Squeaky clean!');
    expect(clean.data.fields ?? []).toHaveLength(0);
  });

  it('describes reports for non-moderators without leaking history', async () => {
    const embed = await userInfoEmbed(null, '222222222222222222', targetData(), 'REPORT', false);
    expect(embed.data.description).toContain('Click the button below');
    expect(embed.data.fields).toBeUndefined();
    expect(mocks.trustScore).not.toHaveBeenCalled();
  });

  it('accepts users, ids and members as targets, and tolerates avatar lookup failures', async () => {
    const user = { id: '333333333333333333', username: 'bob', displayAvatarURL: () => 'https://uav' };
    const e1 = await userInfoEmbed(actor(), user as never, targetData(), 'NOTE', false);
    expect(e1.data.description).toBeUndefined();
    const broken = member({ user: { username: 'x', displayAvatarURL: () => { throw new Error('boom'); } }, displayAvatarURL: () => { throw new Error('boom'); } });
    const e2 = await userInfoEmbed(actor(), broken, targetData(), 'NOTE', false);
    expect(e2.data.thumbnail).toBeUndefined();
    const noName = member({ displayName: '' });
    await expect(userInfoEmbed(actor(), noName, targetData(), 'NOTE', false)).resolves.toBeDefined();
  });
});
