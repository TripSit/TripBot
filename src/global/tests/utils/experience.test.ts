/* eslint-disable no-restricted-syntax */
import type { GuildMember } from 'discord.js';
import {
  awardGitHubXP, expForNextLevel, experience, findXPfromLevel, getTotalLevel, getUserTotalLevel, giveMilestone,
} from '../../utils/experience';
import { dbMock } from '../../../vitest/utils/mockDb';

type Upsert = Awaited<ReturnType<typeof dbMock.users.upsert>>;
type ExpRows = Awaited<ReturnType<typeof dbMock.user_experience.findMany>>;
type ExpRow = NonNullable<Awaited<ReturnType<typeof dbMock.user_experience.findFirst>>>;

const e = env as unknown as Record<string, string>;

const roleSend = vi.fn();
const announce = vi.fn();
const botlog = vi.fn();
const channels: Record<string, { send: typeof vi.fn.prototype }> = {};

function makeMember(owned: string[] = []) {
  const has = new Set(owned);
  const roles = {
    cache: { has: (id: string) => has.has(id) },
    add: vi.fn(async (role: { id: string }) => { has.add(role.id); }),
    remove: vi.fn(async (role: { id: string }) => { has.delete(role.id); }),
  };
  const guild = {
    roles: { fetch: vi.fn(async (id: string) => ({ id })) },
    channels: { fetch: vi.fn(async (id: string) => channels[id] ?? { send: announce }) },
  };
  return {
    member: {
      id: 'm1', displayName: 'Member', toString: () => '<@m1>', roles, guild,
    } as unknown as GuildMember,
    roles,
    guild,
  };
}

const textChannel = (guild: unknown) => ({ id: 'chan', guild }) as never;

beforeEach(() => {
  channels[e.CHANNEL_BOTLOG] = { send: botlog };
  channels[e.CHANNEL_VIPLOUNGE] = { send: roleSend };
  (global as unknown as { discordClient: unknown }).discordClient = {
    guilds: { fetch: vi.fn(async () => ({ channels: { fetch: vi.fn(async () => ({ send: announce })) } })) },
  };
  dbMock.users.upsert.mockResolvedValue({ id: 'u1' } as unknown as Upsert);
});

describe('level maths', () => {
  it('computes xp needed for the next level', async () => {
    expect(await expForNextLevel(0)).toBe(100);
    expect(await expForNextLevel(10)).toBe(1100);
  });

  it('sums xp needed to reach a level', async () => {
    expect(await findXPfromLevel(1)).toBe(0);
    expect(await findXPfromLevel(3)).toBe(155 + 220);
  });

  it('derives level and remaining points from total xp', async () => {
    expect(await getTotalLevel(0)).toEqual({ level: 0, level_points: 0 });
    expect(await getTotalLevel(99)).toEqual({ level: 0, level_points: 99 });
    expect(await getTotalLevel(100)).toEqual({ level: 1, level_points: 0 });
    expect(await getTotalLevel(100 + 155 + 7)).toEqual({ level: 2, level_points: 7 });
  });

  it('returns the pinned level when frozen', async () => {
    expect(await getTotalLevel(0, 50)).toEqual({ level: 50, level_points: await expForNextLevel(50) });
    expect((await getTotalLevel(100, null)).level).toBe(1);
  });
});

describe('getUserTotalLevel', () => {
  it('returns 0 for unknown users', async () => {
    dbMock.users.findUnique.mockResolvedValueOnce(null);
    expect(await getUserTotalLevel('1')).toBe(0);
  });

  it('ignores TOTAL and IGNORED rows', async () => {
    dbMock.users.findUnique.mockResolvedValueOnce({
      user_experience: [
        { category: 'GENERAL', total_points: 100 }, { category: 'TEAM', total_points: 155 },
        { category: 'TOTAL', total_points: 9999 }, { category: 'IGNORED', total_points: 9999 },
      ],
    } as never);
    expect(await getUserTotalLevel('1')).toBe(2);
  });
});

describe('giveMilestone', () => {
  const withExp = (...points: number[]) => dbMock.user_experience.findMany.mockResolvedValueOnce(
    points.map(total_points => ({ category: 'GENERAL', total_points })) as unknown as ExpRows,
  );

  it('gives the base role to new members without announcing', async () => {
    const { member, roles } = makeMember();
    withExp(0);
    await giveMilestone(member);
    expect(roles.add).toHaveBeenCalledWith({ id: e.ROLE_VIP_0 });
    expect(roleSend).not.toHaveBeenCalled();
  });

  it('does nothing when the member already holds the role', async () => {
    const { member, roles } = makeMember([e.ROLE_VIP_0]);
    withExp(0);
    await giveMilestone(member);
    expect(roles.add).not.toHaveBeenCalled();
  });

  it('promotes to tier 1 and removes the lower role', async () => {
    const { member, roles } = makeMember([e.ROLE_VIP_0]);
    withExp(5000);
    await giveMilestone(member);
    await new Promise(resolve => { setImmediate(resolve); });
    expect(roles.add).toHaveBeenCalledWith({ id: e.ROLE_VIP_10 });
    expect(roles.remove).toHaveBeenCalledWith({ id: e.ROLE_VIP_0 });
    expect(roleSend).not.toHaveBeenCalled();
  });

  it('announces tier 2 and above in the VIP lounge', async () => {
    const { member, roles } = makeMember();
    withExp(25000);
    await giveMilestone(member);
    expect(roles.add).toHaveBeenCalledWith({ id: e.ROLE_VIP_20 });
    expect(roleSend).toHaveBeenCalledWith(expect.stringContaining('Total level 20'));
  });
});

describe('experience', () => {
  const row = (over: Partial<ExpRow> = {}) => ({
    id: 'x1',
    user_id: 'u1',
    level: 0,
    level_points: 0,
    total_points: 0,
    last_message_at: new Date(0),
    last_message_channel: 'old',
    ...over,
  }) as unknown as ExpRow;

  it('creates the first record and stops', async () => {
    const { member, guild } = makeMember();
    dbMock.user_experience.findFirst.mockResolvedValueOnce(null);
    await experience(member, 'GENERAL' as never, 'TEXT' as never, textChannel(guild));
    expect(dbMock.user_experience.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        user_id: 'u1', category: 'GENERAL', type: 'TEXT', level: 0,
      }),
    });
    expect(dbMock.user_experience.update).not.toHaveBeenCalled();
  });

  it('does not award xp inside the cooldown', async () => {
    const { member, guild } = makeMember();
    dbMock.user_experience.findFirst.mockResolvedValueOnce(row({ last_message_at: new Date() }));
    await experience(member, 'GENERAL' as never, 'TEXT' as never, textChannel(guild));
    expect(dbMock.user_experience.update).not.toHaveBeenCalled();
  });

  it('awards xp, updates the record and grants roles', async () => {
    const { member, guild, roles } = makeMember();
    dbMock.user_experience.findFirst.mockResolvedValueOnce(row({ level_points: 5, total_points: 5 }));
    dbMock.user_experience.findMany.mockResolvedValueOnce([]);
    await experience(member, 'GENERAL' as never, 'VOICE' as never, textChannel(guild));
    expect(dbMock.user_experience.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'x1' }, data: expect.objectContaining({ last_message_channel: 'chan', level: 0 }),
    }));
    expect(roles.add).toHaveBeenCalled();
  });

  it('levels up, logs it, and announces every tenth level by category', async () => {
    const categories: [string, string][] = [
      ['GENERAL', e.CHANNEL_LOUNGE], ['TRIPSITTER', e.CHANNEL_TRIPSITMETA], ['DEVELOPER', e.CHANNEL_DEVELOPMENT],
      ['TEAM', e.CHANNEL_TEAMTRIPSIT], ['IGNORED', e.CHANNEL_BOTSPAM],
    ];
    for (const [category, channelId] of categories) {
      const { member, guild } = makeMember();
      const fetchChannel = vi.fn(async () => ({ send: announce }));
      (global as unknown as { discordClient: unknown }).discordClient = {
        guilds: { fetch: vi.fn(async () => ({ channels: { fetch: fetchChannel } })) },
      };
      dbMock.user_experience.findFirst.mockResolvedValueOnce(row({ level: 9, level_points: 10000, total_points: 10000 }));
      dbMock.user_experience.findMany.mockResolvedValueOnce([]);
      // eslint-disable-next-line no-await-in-loop
      await experience(member, category as never, 'TEXT' as never, textChannel(guild));
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => { setImmediate(resolve); });
      expect(botlog).toHaveBeenCalledWith(expect.stringContaining('level 10'));
      expect(fetchChannel).toHaveBeenCalledWith(channelId);
    }
  });

  it('levels up without a milestone announcement between tens', async () => {
    const { member, guild } = makeMember();
    dbMock.user_experience.findFirst.mockResolvedValueOnce(row({ level: 3, level_points: 10000, total_points: 10000 }));
    dbMock.user_experience.findMany.mockResolvedValueOnce([]);
    await experience(member, 'GENERAL' as never, 'TEXT' as never, textChannel(guild));
    expect(botlog).toHaveBeenCalledWith(expect.stringContaining('level 4'));
    expect(announce).not.toHaveBeenCalled();
  });
});

describe('awardGitHubXP', () => {
  const dev = (over: Partial<ExpRow> = {}) => ({
    id: 'x1', level: 0, level_points: 0, total_points: 0, ...over,
  }) as unknown as ExpRow;

  it('creates a developer record for new contributors and reports no level change', async () => {
    const { member, guild } = makeMember();
    dbMock.user_experience.findFirst.mockResolvedValueOnce(null);
    dbMock.user_experience.create.mockResolvedValueOnce(dev());
    dbMock.user_experience.findMany.mockResolvedValueOnce([]);
    const result = await awardGitHubXP(member, 50, textChannel(guild), 'easy');
    expect(result).toEqual({
      startLevel: 0, endLevel: 0, levelsGained: 0, xpAwarded: 50, isNewUser: true,
    });
    expect(botlog).toHaveBeenCalledWith(expect.stringContaining('(easy issue)! Still level 0.'));
    expect(dbMock.user_experience.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ level: 0, level_points: 50, total_points: 50 }),
    }));
  });

  it('reports a single level-up', async () => {
    const { member, guild } = makeMember();
    dbMock.user_experience.findFirst.mockResolvedValueOnce(dev({ level_points: 90, total_points: 90 }));
    dbMock.user_experience.findMany.mockResolvedValueOnce([]);
    const result = await awardGitHubXP(member, 20, textChannel(guild));
    expect(result).toMatchObject({ endLevel: 1, levelsGained: 1, isNewUser: false });
    expect(botlog).toHaveBeenCalledWith(expect.stringContaining('leveled up to Developer Text level 1'));
  });

  it('reports multiple levels and announces milestone levels', async () => {
    const { member, guild } = makeMember();
    dbMock.user_experience.findFirst.mockResolvedValueOnce(dev());
    dbMock.user_experience.findMany.mockResolvedValueOnce([]);
    const result = await awardGitHubXP(member, 5000, textChannel(guild));
    expect(result.levelsGained).toBe(10);
    expect(result.endLevel).toBe(10);
    expect(botlog).toHaveBeenCalledWith(expect.stringContaining('gained 10 levels'));
    expect(announce).toHaveBeenCalledWith(expect.stringContaining('Developer Text level 10'));
  });

  it('caps levels at 100', async () => {
    const { member, guild } = makeMember();
    dbMock.user_experience.findFirst.mockResolvedValueOnce(dev({ level: 99 }));
    dbMock.user_experience.findMany.mockResolvedValueOnce([]);
    const result = await awardGitHubXP(member, 10_000_000, textChannel(guild));
    expect(result.endLevel).toBe(100);
    expect(result.levelsGained).toBe(1);
  });
});
