/* eslint-disable max-len, sonarjs/no-duplicate-string */
import {
  dProfile, getProfilePreview, numFormatter, numFormatterVoice,
} from '../../commands/guild/d.profile';
import { slashStub } from '../../../vitest/utils/commandStubs';

const mocks = vi.hoisted(() => ({
  profile: vi.fn(), persona: vi.fn(), asset: vi.fn(), loadImage: vi.fn(), freeze: vi.fn(), total: vi.fn(), next: vi.fn(),
}));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/commands/g.profile', () => ({ profile: mocks.profile }));
vi.mock('../../../global/commands/g.rpg', () => ({ getPersonaInfo: mocks.persona }));
vi.mock('../../../global/commands/g.levelFreeze', () => ({ getLevelFreeze: mocks.freeze }));
vi.mock('../../../global/utils/experience', () => ({ getTotalLevel: mocks.total, expForNextLevel: mocks.next }));
vi.mock('../../utils/getAsset', () => ({ default: mocks.asset }));
vi.mock('../../utils/canvasUtils', () => ({
  deFuckifyText: (t: string) => t.replace(/[^a-z]/gi, ''), generateColors: () => '#000000', resizeText: () => '14px futura',
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
const member = (roleIds: string[] = [], over: Record<string, unknown> = {}) => ({
  displayName: 'Mem', roles: { cache: new Set(roleIds), color: { color: 0xff0000 } }, user: { username: 'mem', displayAvatarURL: () => 'https://av' }, ...over,
});

describe('number formatters', () => {
  it('abbreviate thousands and millions', () => {
    expect(numFormatter(5)).toBe('5');
    expect(numFormatter(1500)).toBe('1.50K');
    expect(numFormatter(2500000)).toBe('2.50M');
    expect(numFormatterVoice(5)).toBe('5.0');
    expect(numFormatterVoice(1500)).toBe('1.5K');
    expect(numFormatterVoice(2500000)).toBe('2.5M');
  });
});

describe('profile', () => {
  beforeEach(() => {
    mocks.profile.mockResolvedValue({
      karma_received: 3, tokens: 9, totalTextExp: 400, totalVoiceExp: 6000, timezone: 'UTC', birthday: new Date('2000-01-02'),
    });
    mocks.persona.mockResolvedValue({ id: 'p1' });
    mocks.asset.mockResolvedValue(Buffer.from('x'));
    mocks.loadImage.mockResolvedValue({});
    mocks.freeze.mockResolvedValue(null);
    mocks.total.mockResolvedValue({ level: 5, level_points: 10 });
    mocks.next.mockResolvedValue(100);
    db.rpg_inventory.findMany = vi.fn().mockResolvedValue([]) as never;
  });

  const run = async (memberValue: unknown = member(), options: Record<string, unknown> = {}) => {
    const guild = { members: { fetch: vi.fn(async () => { if (!memberValue) throw new Error('gone'); return memberValue; }) } };
    const stub = slashStub({ guild, options, user: { id: 'u1', username: 'alice', displayAvatarURL: () => 'https://av' } });
    const result = await dProfile.execute(stub as never);
    return { stub, result };
  };

  it('needs a guild', async () => {
    expect(await dProfile.execute(slashStub({ guild: null }) as never)).toBe(false);
  });

  it.each([5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 100])('level %i uses the matching badge', async level => {
    mocks.total.mockResolvedValue({ level, level_points: 1 });
    const { stub } = await run();
    expect(stub.editReply).toHaveBeenCalledWith({ files: expect.any(Array) });
    expect(mocks.asset).toHaveBeenCalledWith(`badgeVip${Math.min(Math.floor(level / 10), 10)}`);
  });

  it('renders icons for each special role', async () => {
    const roles = [e.ROLE_TEAMTRIPSIT, e.ROLE_PREMIUM, e.ROLE_BOOSTER, e.ROLE_LEGACY];
    expect((await run(member(roles), { ephemeral: true, target: { id: 't', username: 't', displayAvatarURL: () => 'https://av' } })).result).toBe(true);
    expect((await run(member([e.ROLE_PREMIUM]))).result).toBe(true);
  });

  it('copes with departed users, empty stats and no birthday/timezone', async () => {
    mocks.profile.mockResolvedValue({
      karma_received: 0, tokens: 0, totalTextExp: 0, totalVoiceExp: 0,
    });
    expect((await run(null)).result).toBe(true);
    expect((await run(member([], { roles: { cache: new Set<string>(), color: null } }))).result).toBe(true);
  });

  it('draws the birthday overlay on the birthday, with single-digit days', async () => {
    const today = new Date();
    mocks.profile.mockResolvedValue({
      karma_received: 1, tokens: 1, totalTextExp: 1, totalVoiceExp: 1, birthday: new Date(2000, today.getMonth(), today.getDate()),
    });
    expect((await run()).result).toBe(true);
    mocks.profile.mockResolvedValue({
      karma_received: 1, tokens: 1, totalTextExp: 1, totalVoiceExp: 1, birthday: new Date(2000, 5, 5),
    });
    expect((await run()).result).toBe(true);
  });

  it('applies equipped inventory', async () => {
    db.rpg_inventory.findMany = vi.fn().mockResolvedValue([
      { equipped: true, effect: 'background', value: 'bg1' },
      { equipped: true, effect: 'font', value: 'comic' },
      { equipped: true, effect: 'userflair', effect_value: 'Flair!' },
    ]) as never;
    expect((await run()).result).toBe(true);
    expect(mocks.asset).toHaveBeenCalledWith('comic');
  });

  it('falls back to the username when the display name is mostly decoration', async () => {
    const { stub } = await run(member([], { displayName: '★★★★★a' }));
    expect(stub.editReply).toHaveBeenCalled();
    const attachment = (stub.editReply.mock.calls[0][0] as { files: Array<{ name: string }> }).files[0];
    expect(attachment.name).toContain('TS_Profile_Alice_');
  });
});

describe('getProfilePreview', () => {
  beforeEach(() => {
    mocks.asset.mockResolvedValue(Buffer.from('x'));
    mocks.loadImage.mockResolvedValue({});
  });

  it.each([
    ['background', 'https://bg', undefined],
    ['font', undefined, 'comic'],
    ['userflair', undefined, undefined],
    ['none', undefined, undefined],
  ])('renders a %s preview', async (option, imagePath, font) => {
    const buffer = await getProfilePreview(member() as never, option, imagePath, font);
    expect(Buffer.isBuffer(buffer)).toBe(true);
  });

  it('falls back to the username for mostly-decorated names', async () => {
    const buffer = await getProfilePreview(member([], { displayName: '★★★★★a', roles: { cache: new Set(), color: null } }) as never, 'none');
    expect(buffer.length).toBeGreaterThan(0);
  });
});
