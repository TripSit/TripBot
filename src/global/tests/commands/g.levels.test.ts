import { dbMock } from '../../../vitest/utils/mockDb';
import {
  getAllLevelFreezes, getLevelFreeze, getLevelFreezes, isValidFreezeLevel,
  NICE_LEVEL, removeLevelFreeze, setLevelFreeze,
} from '../../commands/g.levelFreeze';
import { leaderboardV2 } from '../../commands/g.leaderboard';
import { levels } from '../../commands/g.levels';
import { MAX_EXPERIENCE_LEVEL, MIN_EXPERIENCE_LEVEL } from '../../utils/experience';

const asMock = (fn: unknown) => fn as ReturnType<typeof vi.fn>;

type Rows<T extends (...a: never[]) => unknown> = Awaited<ReturnType<T>>;

describe('levelFreeze', () => {
  it('validates levels', () => {
    expect(isValidFreezeLevel(MIN_EXPERIENCE_LEVEL)).toBe(true);
    expect(isValidFreezeLevel(MAX_EXPERIENCE_LEVEL)).toBe(true);
    expect(isValidFreezeLevel(MAX_EXPERIENCE_LEVEL + 1)).toBe(false);
    expect(isValidFreezeLevel(MIN_EXPERIENCE_LEVEL - 1)).toBe(false);
    expect(isValidFreezeLevel(1.5)).toBe(false);
  });

  it('rejects invalid levels without writing', async () => {
    await expect(setLevelFreeze('1', -5)).rejects.toThrow(RangeError);
    expect(dbMock.users.upsert).not.toHaveBeenCalled();
  });

  it.each([NICE_LEVEL, 10])('sets a freeze at level %i', async level => {
    await setLevelFreeze('1', level);
    expect(dbMock.users.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { level_freeze: level } }));
  });

  it('reports whether a freeze was removed', async () => {
    dbMock.users.updateMany.mockResolvedValueOnce({ count: 1 });
    expect(await removeLevelFreeze('1')).toBe(true);
    dbMock.users.updateMany.mockResolvedValueOnce({ count: 0 });
    expect(await removeLevelFreeze('1')).toBe(false);
  });

  it('gets a single freeze or null', async () => {
    dbMock.users.findUnique.mockResolvedValueOnce({ level_freeze: 12 } as Rows<typeof dbMock.users.findUnique>);
    expect(await getLevelFreeze('1')).toBe(12);
    dbMock.users.findUnique.mockResolvedValueOnce(null);
    expect(await getLevelFreeze('1')).toBeNull();
  });

  it('lists all freezes, dropping rows with null fields', async () => {
    dbMock.users.findMany.mockResolvedValueOnce([
      { discord_id: 'a', level_freeze: 9 },
      { discord_id: null, level_freeze: 8 },
      { discord_id: 'c', level_freeze: null },
    ] as Rows<typeof dbMock.users.findMany>);
    expect(await getAllLevelFreezes()).toEqual([{ discordId: 'a', frozenLevel: 9 }]);
  });

  it('batches freeze lookups', async () => {
    expect(await getLevelFreezes([])).toEqual(new Map());
    expect(dbMock.users.findMany).not.toHaveBeenCalled();
    dbMock.users.findMany.mockResolvedValueOnce([
      { discord_id: 'a', level_freeze: 9 }, { discord_id: null, level_freeze: 1 },
    ] as Rows<typeof dbMock.users.findMany>);
    expect(await getLevelFreezes(['a', 'b'])).toEqual(new Map([['a', 9]]));
  });
});

describe('leaderboardV2', () => {
  it('builds every type/category combination by default', async () => {
    asMock(dbMock.user_experience.groupBy).mockResolvedValue([
      { user_id: 'u1', _sum: { total_points: 5 } },
      { user_id: 'u2', _sum: { total_points: 50 } },
      { user_id: 'u3', _sum: { total_points: null } },
    ] as unknown as Rows<typeof dbMock.user_experience.groupBy>);
    dbMock.users.findMany.mockResolvedValue([
      { id: 'u1', discord_id: 'd1' }, { id: 'u2', discord_id: 'd2' }, { id: 'u3', discord_id: null },
    ] as Rows<typeof dbMock.users.findMany>);
    dbMock.user_experience.findMany.mockResolvedValue([
      { total_points: 7, users: { discord_id: 'd1' } },
    ] as unknown as Rows<typeof dbMock.user_experience.findMany>);

    const data = await leaderboardV2();
    expect(data.ALL.TOTAL.map(r => r.discord_id)).toEqual(['d2', 'd1', '']);
    expect(data.ALL.TOTAL[2].total_points).toBe(0);
    expect(data.TEXT.GENERAL).toEqual([{ discord_id: 'd1', total_points: 7 }]);
  });

  it('restricts to a single type and category', async () => {
    dbMock.user_experience.findMany.mockResolvedValueOnce([]);
    const data = await leaderboardV2('TEXT', 'GENERAL');
    expect(data.TEXT.GENERAL).toEqual([]);
    expect(dbMock.user_experience.findMany).toHaveBeenCalledTimes(1);
    expect(dbMock.user_experience.groupBy).not.toHaveBeenCalled();
  });
});

describe('levels', () => {
  const board = (ids: string[]) => {
    asMock(dbMock.user_experience.groupBy).mockResolvedValue(
      ids.map((_id, i) => ({ user_id: `u${i}`, _sum: { total_points: 1000 - i } })) as unknown as
        Rows<typeof dbMock.user_experience.groupBy>,
    );
    dbMock.users.findMany.mockResolvedValue(
      ids.map((id, i) => ({ id: `u${i}`, discord_id: id })) as Rows<typeof dbMock.users.findMany>,
    );
    dbMock.user_experience.findMany.mockResolvedValue([]);
  };

  it('ranks the user and leaves unseen categories zeroed', async () => {
    board(['other', 'me']);
    dbMock.users.findUnique.mockResolvedValueOnce(null);
    const result = await levels('me');
    expect(result.ALL.TOTAL.rank).toBe(2);
    expect(result.ALL.TOTAL.total_exp).toBe(999);
    expect(result.TEXT.TOTAL.rank).toBe(2);
  });

  it('leaves users absent from the leaderboard zeroed', async () => {
    board(['other']);
    dbMock.users.findUnique.mockResolvedValueOnce(null);
    const result = await levels('nobody');
    expect(result.ALL.TOTAL).toEqual({
      level: 0, level_exp: 0, nextLevel: 0, total_exp: 0, rank: 0,
    });
  });

  it('pins the displayed level when frozen but keeps xp and rank', async () => {
    board(['me']);
    dbMock.users.findUnique.mockResolvedValueOnce({ level_freeze: 20 } as Rows<typeof dbMock.users.findUnique>);
    const result = await levels('me');
    expect(result.ALL.TOTAL.level).toBe(20);
    expect(result.ALL.TOTAL.total_exp).toBe(1000);
    expect(result.ALL.TOTAL.rank).toBe(1);
    expect(result.TEXT.TOTAL.level).toBe(20);
  });

  it('pins the headline totals even for a frozen user with no xp', async () => {
    board(['other']);
    dbMock.users.findUnique.mockResolvedValueOnce({ level_freeze: 20 } as Rows<typeof dbMock.users.findUnique>);
    const result = await levels('nobody');
    expect(result.ALL.TOTAL).toMatchObject({ level: 20, total_exp: 0, rank: 0 });
    expect(result.TEXT.TOTAL.level).toBe(20);
    expect(result.VOICE.TOTAL.level).toBe(0);
  });
});
