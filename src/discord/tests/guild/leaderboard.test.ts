/* eslint-disable max-len, sonarjs/no-duplicate-string */
import { dLeaderboard } from '../../commands/guild/d.leaderboard';
import { slashStub } from '../../../vitest/utils/commandStubs';
import { collectionOf } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  board: vi.fn(), freezes: vi.fn(), total: vi.fn(), asset: vi.fn(), pager: vi.fn(), loadImage: vi.fn(),
}));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/commands/g.leaderboard', () => ({ leaderboardV2: mocks.board }));
vi.mock('../../../global/commands/g.levelFreeze', () => ({ getLevelFreezes: mocks.freezes }));
vi.mock('../../../global/utils/experience', () => ({ getTotalLevel: mocks.total }));
vi.mock('../../utils/getAsset', () => ({ default: mocks.asset }));
vi.mock('../../utils/pager', () => ({ runPager: mocks.pager }));
vi.mock('../../utils/canvasUtils', () => ({ deFuckifyText: (t: string) => t, resizeText: () => '14px futura' }));
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

const row = (id: string, points = 10) => ({ discord_id: id, total_points: points });
const member = (id: string) => ({
  id, displayName: `name-${id}`, displayColor: 1, displayHexColor: '#fff', displayAvatarURL: () => 'https://av',
});

const setup = (ids: string[], options: Record<string, unknown> = {}, over: Record<string, unknown> = {}) => {
  const cache = collectionOf(ids.map(id => [id, member(id)] as [string, ReturnType<typeof member>]));
  const guild = {
    members: { cache, fetch: vi.fn(async () => cache), ...over },
  };
  return { stub: slashStub({ guild, options }), guild };
};

describe('leaderboard', () => {
  beforeEach(() => {
    mocks.board.mockReset();
    mocks.freezes.mockResolvedValue(new Map([['a', 5]]));
    mocks.total.mockResolvedValue({ level: 7 });
    mocks.asset.mockResolvedValue(Buffer.from('x'));
    mocks.loadImage.mockResolvedValue({});
    mocks.pager.mockReset();
    db.users.findMany = vi.fn().mockResolvedValue([
      { discord_id: 'a', personas: { rpg_inventory: [{ effect: 'font', value: 'comic' }, { effect: 'background', value: 'bg1' }] } },
      { discord_id: 'b', personas: null },
      { discord_id: null, personas: { rpg_inventory: [] } },
    ]) as never;
  });

  it('requires a guild', async () => {
    const stub = slashStub({ guild: null });
    expect(await dLeaderboard.execute(stub as never)).toBe(false);
  });

  it('renders ranked pages through the pager, including equipped cosmetics', async () => {
    const ids = Array.from({ length: 20 }, (_, i) => `u${i}`);
    mocks.board.mockResolvedValue({ ALL: { TOTAL: [row('a'), row('b'), ...ids.map(id => row(id))] } });
    const { stub, guild } = setup(['a', 'b', ...ids], { ephemeral: true });
    expect(await dLeaderboard.execute(stub as never)).toBe(true);
    expect(guild.members.fetch).toHaveBeenCalledWith({ user: expect.any(Array) });
    const config = mocks.pager.mock.calls[0][1];
    expect(config.pageCount).toBe(2);
    expect(config.showControls).toBe(true);
    const first = await config.renderPage(0);
    expect(first.files).toHaveLength(1);
    const cached = await config.renderPage(0);
    expect(cached.files).toHaveLength(1);
    await config.renderPage(1);
  });

  it('survives missing assets and avatars', async () => {
    mocks.board.mockResolvedValue({ ALL: { TOTAL: [row('a'), row('b')] } });
    mocks.asset.mockRejectedValue(new Error('no font'));
    mocks.loadImage.mockRejectedValue(new Error('no img'));
    const { stub } = setup(['a', 'b']);
    await dLeaderboard.execute(stub as never);
    const page = await mocks.pager.mock.calls[0][1].renderPage(0);
    expect(page.files).toHaveLength(1);
  });

  it('handles voice category, an empty board and focus users', async () => {
    mocks.board.mockResolvedValue({});
    const empty = setup([], { category: 'VOICE' });
    await dLeaderboard.execute(empty.stub as never);
    expect(mocks.board).toHaveBeenCalledWith('VOICE', 'TOTAL');
    const config = mocks.pager.mock.calls[0][1];
    expect(config.pageCount).toBe(1);
    expect(config.showControls).toBe(false);
    await config.renderPage(0);

    const ids = Array.from({ length: 30 }, (_, i) => `m${i}`);
    mocks.board.mockResolvedValue({ ALL: { GENERAL: ids.map(id => row(id)) } });
    const focus = setup(ids, { category: 'GENERAL', user: { id: 'm25' } });
    await dLeaderboard.execute(focus.stub as never);
    expect(mocks.pager.mock.calls[1][1].startIndex).toBe(2);
    await mocks.pager.mock.calls[1][1].renderPage(2);
  });

  it('fetches a missing focus member and falls back to per-member fetches', async () => {
    mocks.board.mockResolvedValue({ ALL: { TOTAL: [row('a')] } });
    const fetch = vi.fn(async (arg: unknown) => {
      if (typeof arg === 'object') throw new Error('bulk failed');
      return member(String(arg));
    });
    const { stub } = setup(['a'], { user: { id: 'outsider' } }, { fetch });
    await dLeaderboard.execute(stub as never);
    expect(fetch).toHaveBeenCalledWith('outsider');
    expect(fetch).toHaveBeenCalledWith('a');
    const gone = setup(['a'], { user: { id: 'ghost' } }, { fetch: vi.fn().mockRejectedValue(new Error('x')) });
    await dLeaderboard.execute(gone.stub as never);
    expect(mocks.pager).toHaveBeenCalledTimes(2);
  });
});
