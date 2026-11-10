/* eslint-disable max-len, sonarjs/no-duplicate-string */
import { dLevels } from '../../commands/guild/d.levels';
import { slashStub } from '../../../vitest/utils/commandStubs';

const mocks = vi.hoisted(() => ({
  levels: vi.fn(), profile: vi.fn(), persona: vi.fn(), asset: vi.fn(), loadImage: vi.fn(),
}));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/commands/g.levels', () => ({ levels: mocks.levels }));
vi.mock('../../../global/commands/g.profile', () => ({ profile: mocks.profile }));
vi.mock('../../../global/commands/g.rpg', () => ({ getPersonaInfo: mocks.persona }));
vi.mock('../../utils/getAsset', () => ({ default: mocks.asset }));
vi.mock('../../utils/canvasUtils', () => ({
  deFuckifyText: (t: string) => (t.startsWith('★') ? '' : t), generateColors: () => '#000000', resizeText: () => '14px futura',
}));
vi.mock('@napi-rs/canvas', () => {
  const ctx = new Proxy({ measureText: () => ({ width: 10 }) } as Record<string, unknown>, {
    get: (target, key: string) => (key in target ? target[key] : vi.fn()),
    set: () => true,
  });
  const api = {
    createCanvas: vi.fn(() => ({ getContext: () => ctx, encode: async () => Buffer.from('png') })),
    loadImage: mocks.loadImage,
  };
  return { default: api, ...api };
});

const e = env as unknown as Record<string, string>;
const lvl = (level: number, rank = 4) => ({
  level, level_exp: 5, nextLevel: 10, total_exp: 50, rank,
});

const levelData = (total: number, extra: Record<string, unknown> = {}) => ({
  ALL: { TOTAL: lvl(total) },
  TEXT: { TOTAL: lvl(total), GENERAL: lvl(3, 2), ...extra },
  VOICE: { TOTAL: { level: 0 } },
});

const member = (roleIds: string[] = [], over: Record<string, unknown> = {}) => ({
  displayName: 'Mem', roles: { cache: new Set(roleIds), color: { color: 0xff0000 } }, ...over,
});

const run = async (data: unknown, memberValue: unknown = member(), options: Record<string, unknown> = {}) => {
  mocks.levels.mockResolvedValue(data);
  const guild = { members: { fetch: vi.fn(async () => { if (!memberValue) throw new Error('gone'); return memberValue; }) } };
  const stub = slashStub({ guild, options, user: { id: 'u1', username: 'alice', displayAvatarURL: () => 'https://av' } });
  const result = await dLevels.execute(stub as never);
  return { stub, result };
};

describe('levels', () => {
  beforeEach(() => {
    mocks.profile.mockResolvedValue({ totalTextExp: 400, totalVoiceExp: 6000 });
    mocks.persona.mockResolvedValue({ id: 'p1' });
    mocks.asset.mockResolvedValue(Buffer.from('x'));
    mocks.loadImage.mockResolvedValue({});
    db.rpg_inventory.findMany = vi.fn().mockResolvedValue([]) as never;
  });

  it('needs a guild', async () => {
    const stub = slashStub({ guild: null });
    expect(await dLevels.execute(stub as never)).toBe(false);
  });

  it.each([5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 100])('picks the badge for level %i', async level => {
    const { stub, result } = await run(levelData(level));
    expect(result).toBe(true);
    expect(stub.editReply).toHaveBeenCalledWith(expect.objectContaining({ files: expect.any(Array), components: expect.any(Array) }));
    const badge = Math.min(Math.floor(level / 10), 10);
    expect(mocks.asset).toHaveBeenCalledWith(`badgeVip${badge}`);
  });

  it('lays out every extra XP bar and avatar icon for a stacked member', async () => {
    const roles = [e.ROLE_TEAMTRIPSIT, e.ROLE_PREMIUM, e.ROLE_BOOSTER, e.ROLE_LEGACY, e.ROLE_TRIPSITTER, e.ROLE_DEVELOPER];
    const data = levelData(50, { TRIPSITTER: lvl(8, 0), DEVELOPER: lvl(9), TEAM: lvl(0, 0) });
    data.VOICE = { TOTAL: lvl(6, 3) } as never;
    const { stub } = await run(data, member(roles), { ephemeral: true });
    expect(stub.deferReply).toHaveBeenCalledWith({ flags: expect.anything() });
    expect(stub.editReply).toHaveBeenCalled();
  });

  it('handles members with no extra roles, missing text categories and departed users', async () => {
    const bare = levelData(1);
    delete (bare.TEXT as Record<string, unknown>).GENERAL;
    await run(bare, member(), { target: { id: 't', username: 'tee', displayAvatarURL: () => 'https://av' } });
    const left = await run(levelData(1), null);
    expect(left.result).toBe(true);
    const noColor = await run(levelData(1), member([], { roles: { cache: new Set<string>(), color: null } }));
    expect(noColor.result).toBe(true);
  });

  it('uses the Developer bar when the dev level is over 5 and the helper bar for helpers', async () => {
    await run(levelData(10, { DEVELOPER: lvl(6, 1) }), member([e.ROLE_HELPER]));
    expect(mocks.asset).toHaveBeenCalledWith('developerBar');
  });

  it('applies equipped inventory and surfaces lookup failures', async () => {
    db.rpg_inventory.findMany = vi.fn().mockResolvedValue([
      { equipped: true, effect: 'background', value: 'bg1' },
      { equipped: true, effect: 'font', value: 'comic' },
      { equipped: true, effect: 'userflair', effect_value: 'Flair!' },
      { equipped: false, effect: 'font', value: 'unused' },
    ]) as never;
    const { result } = await run(levelData(20));
    expect(result).toBe(true);
    // Each lookup is awaited inside the Promise.allSettled array literal, so a failure rejects the command.
    mocks.persona.mockResolvedValueOnce(null);
    expect((await run(levelData(20))).result).toBe(true);
    mocks.profile.mockRejectedValueOnce(new Error('x'));
    await expect(run(levelData(20))).rejects.toThrow('x');
  });

  it('falls back to the username when the display name is mostly decoration', async () => {
    const { stub } = await run(levelData(10), member([], { displayName: '★★★★★' }));
    const attachment = (stub.editReply.mock.calls[0][0] as { files: Array<{ name: string }> }).files[0];
    expect(attachment.name).toContain('TS_Levels_Alice_');
  });

  it('draws zero ranks for the third bar, real ranks for the fourth, and zero stats without chat activity', async () => {
    mocks.profile.mockResolvedValue({ totalTextExp: 0, totalVoiceExp: 0 });
    const roles = [e.ROLE_TRIPSITTER, e.ROLE_DEVELOPER, e.ROLE_TEAMTRIPSIT];
    const data = levelData(20, { TRIPSITTER: lvl(2, 3), DEVELOPER: lvl(9, 0), TEAM: lvl(4, 6) });
    data.VOICE = { TOTAL: lvl(6, 3) } as never;
    const { result } = await run(data, member(roles));
    expect(result).toBe(true);
  });
});
