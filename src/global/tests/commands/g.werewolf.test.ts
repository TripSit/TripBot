import { werewolf_players } from '@db/tripbot';
import {
  assignRoles,
  castVote,
  checkWinCondition,
  gameCreate,
  playerJoin,
  playerLeave,
  Prisma,
  resolveDayHang,
  resolveNightKill,
  tallyVotes,
  werewolfRequiredPlayers,
} from '../../commands/g.werewolf';
import { dbMock } from '../../../vitest/utils/mockDb';

const gameId = 'a0000000-0000-4000-8000-000000000001';
const guildId = '960606557622657026';
const channelId = '123456789';

type VoteCount = { target_id: string; _count: { target_id: number } };

function player(overrides: Partial<werewolf_players>): werewolf_players {
  return {
    id: 'p0000000-0000-4000-8000-000000000001',
    game_id: gameId,
    discord_id: 'player-1',
    role: 'VILLAGER',
    team: 'TOWN',
    is_alive: true,
    killed_on_day: null,
    hung_on_day: null,
    joined_at: new Date('2024-01-01'),
    ...overrides,
  } as werewolf_players;
}

describe('assignRoles', () => {
  it('assigns every player exactly once and matches team to role', () => {
    const players = Array.from({ length: 8 }, (_, i) => `player-${i}`);
    const assignments = assignRoles(players);

    expect(assignments).toHaveLength(players.length);
    expect(assignments.map(a => a.discord_id).sort()).toEqual([...players].sort());
    assignments.forEach(a => {
      expect(a.team).toBe(a.role === 'WOLF' ? 'WOLVES' : 'TOWN');
    });
  });

  it('assigns no special roles below the minimum player threshold', () => {
    // Below werewolfRequiredPlayers, nobody should be able to kill.
    const players = Array.from({ length: werewolfRequiredPlayers - 1 }, (_, i) => `player-${i}`);
    const assignments = assignRoles(players);
    expect(assignments.every(a => a.role === 'VILLAGER')).toBe(true);
  });

  it('scales wolf count and gates Seer/Hunter by player count', () => {
    const countRoles = (n: number) => {
      const players = Array.from({ length: n }, (_, i) => `player-${i}`);
      const assignments = assignRoles(players);
      return {
        wolves: assignments.filter(a => a.role === 'WOLF').length,
        seers: assignments.filter(a => a.role === 'SEER').length,
        hunters: assignments.filter(a => a.role === 'HUNTER').length,
      };
    };

    expect(countRoles(4)).toEqual({ wolves: 1, seers: 0, hunters: 0 });
    expect(countRoles(6)).toEqual({ wolves: 1, seers: 1, hunters: 0 });
    expect(countRoles(7)).toEqual({ wolves: 2, seers: 1, hunters: 0 });
    expect(countRoles(8)).toEqual({ wolves: 2, seers: 1, hunters: 1 });
  });

  it('requires at least werewolfRequiredPlayers for a wolf to be assigned', () => {
    const players = Array.from({ length: werewolfRequiredPlayers }, (_, i) => `player-${i}`);
    const assignments = assignRoles(players);
    expect(assignments.some(a => a.role === 'WOLF')).toBe(true);
  });
});

describe('tallyVotes', () => {
  function mockGroupBy(votes: VoteCount[]) {
    vi.mocked(dbMock.werewolf_votes.groupBy).mockResolvedValueOnce(votes as never);
  }

  it('returns null when there are no votes', async () => {
    mockGroupBy([]);
    const result = await tallyVotes(gameId, 1, 'NIGHT');
    expect(result).toBeNull();
  });

  it('returns null on a tie', async () => {
    mockGroupBy([
      { target_id: 'player-a', _count: { target_id: 2 } },
      { target_id: 'player-b', _count: { target_id: 2 } },
    ]);
    const result = await tallyVotes(gameId, 1, 'NIGHT');
    expect(result).toBeNull();
  });

  it('returns the target with the most votes', async () => {
    mockGroupBy([
      { target_id: 'player-a', _count: { target_id: 1 } },
      { target_id: 'player-b', _count: { target_id: 3 } },
    ]);
    const result = await tallyVotes(gameId, 1, 'AFTERNOON');
    expect(result).toBe('player-b');
  });
});

describe('castVote', () => {
  it('upserts the vote keyed on game/day/phase/voter, so revoting changes the target', async () => {
    await castVote(gameId, 2, 'NIGHT', 'voter-1', 'target-1');

    expect(dbMock.werewolf_votes.upsert).toHaveBeenCalledWith({
      where: {
        game_id_day_phase_voter_id: {
          game_id: gameId, day: 2, phase: 'NIGHT', voter_id: 'voter-1',
        },
      },
      create: {
        game_id: gameId, day: 2, phase: 'NIGHT', voter_id: 'voter-1', target_id: 'target-1',
      },
      update: { target_id: 'target-1' },
    });
  });
});

describe('resolveNightKill', () => {
  it('does not kill anyone when the vote is a tie or empty', async () => {
    vi.mocked(dbMock.werewolf_votes.groupBy).mockResolvedValueOnce([] as never);

    const victim = await resolveNightKill(gameId, 1);

    expect(victim).toBeNull();
    expect(dbMock.werewolf_players.updateMany).not.toHaveBeenCalled();
  });

  it('marks the top-voted player dead with the current day, not a hardcoded id', async () => {
    vi.mocked(dbMock.werewolf_votes.groupBy).mockResolvedValueOnce([
      { target_id: 'victim-1', _count: { target_id: 2 } },
    ] as never);
    dbMock.werewolf_players.updateMany.mockResolvedValueOnce({ count: 1 });

    const victim = await resolveNightKill(gameId, 3);

    expect(victim).toBe('victim-1');
    expect(dbMock.werewolf_players.updateMany).toHaveBeenCalledWith({
      where: { game_id: gameId, discord_id: 'victim-1', is_alive: true },
      data: { is_alive: false, killed_on_day: 3 },
    });
  });

  it('returns null instead of throwing when the top-voted target is not a living player in this game', async () => {
    // e.g. a stale Kill button click from a previous, already-ended game.
    vi.mocked(dbMock.werewolf_votes.groupBy).mockResolvedValueOnce([
      { target_id: 'not-a-real-player', _count: { target_id: 1 } },
    ] as never);
    dbMock.werewolf_players.updateMany.mockResolvedValueOnce({ count: 0 });

    const victim = await resolveNightKill(gameId, 1);

    expect(victim).toBeNull();
  });
});

describe('resolveDayHang', () => {
  it('marks the top-voted player hung with the current day', async () => {
    vi.mocked(dbMock.werewolf_votes.groupBy).mockResolvedValueOnce([
      { target_id: 'suspect-1', _count: { target_id: 4 } },
    ] as never);
    dbMock.werewolf_players.updateMany.mockResolvedValueOnce({ count: 1 });

    const suspect = await resolveDayHang(gameId, 5);

    expect(suspect).toBe('suspect-1');
    expect(dbMock.werewolf_players.updateMany).toHaveBeenCalledWith({
      where: { game_id: gameId, discord_id: 'suspect-1', is_alive: true },
      data: { is_alive: false, hung_on_day: 5 },
    });
  });
});

describe('checkWinCondition', () => {
  it('returns TOWN when no wolves are left alive', async () => {
    dbMock.werewolf_players.count.mockResolvedValueOnce(0); // wolves alive
    dbMock.werewolf_players.count.mockResolvedValueOnce(3); // town alive
    expect(await checkWinCondition(gameId)).toBe('TOWN');
  });

  it('returns WOLVES when no townsfolk are left alive', async () => {
    dbMock.werewolf_players.count.mockResolvedValueOnce(1); // wolves alive
    dbMock.werewolf_players.count.mockResolvedValueOnce(0); // town alive
    expect(await checkWinCondition(gameId)).toBe('WOLVES');
  });

  it('returns null while town still outnumbers the wolves', async () => {
    dbMock.werewolf_players.count.mockResolvedValueOnce(1);
    dbMock.werewolf_players.count.mockResolvedValueOnce(2);
    expect(await checkWinCondition(gameId)).toBeNull();
  });

  it('returns WOLVES once wolves reach parity with town, even if town is not zero', async () => {
    // Standard Mafia/Werewolf rule: town can never win a fair vote once wolves have parity.
    dbMock.werewolf_players.count.mockResolvedValueOnce(2); // wolves alive
    dbMock.werewolf_players.count.mockResolvedValueOnce(2); // town alive
    expect(await checkWinCondition(gameId)).toBe('WOLVES');
  });
});

describe('gameCreate', () => {
  it('creates a game when the guild has none in progress', async () => {
    dbMock.werewolf_games.findUnique.mockResolvedValueOnce(null);
    dbMock.werewolf_games.create.mockResolvedValueOnce({ id: gameId } as never);

    const game = await gameCreate(guildId, channelId);

    expect(game).toEqual({ id: gameId });
    expect(dbMock.werewolf_games.create).toHaveBeenCalledWith({
      data: {
        guild_id: guildId,
        channel_id: channelId,
        wolfden_channel_id: env.CHANNEL_WOLFDEN || null,
      },
    });
  });

  it('refuses to create a second game for a guild that already has one', async () => {
    dbMock.werewolf_games.findUnique.mockResolvedValueOnce({ id: 'existing-game' } as never);

    const game = await gameCreate(guildId, channelId);

    expect(game).toBeNull();
    expect(dbMock.werewolf_games.create).not.toHaveBeenCalled();
  });

  it('returns null instead of throwing when two concurrent creates race past the existence check', async () => {
    // Both callers see no existing game (TOCTOU), but the guild_id unique constraint catches the
    // second insert - this should look the same to the caller as "a game already exists".
    dbMock.werewolf_games.findUnique.mockResolvedValueOnce(null);
    dbMock.werewolf_games.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '7.9.1' }),
    );

    const game = await gameCreate(guildId, channelId);

    expect(game).toBeNull();
  });
});

describe('playerJoin / playerLeave', () => {
  it('upserts the player row on join so a re-join is a no-op, not a duplicate', async () => {
    dbMock.werewolf_players.findMany.mockResolvedValueOnce([player({ discord_id: 'player-1' })]);

    await playerJoin(gameId, 'player-1');

    expect(dbMock.werewolf_players.upsert).toHaveBeenCalledWith({
      where: { game_id_discord_id: { game_id: gameId, discord_id: 'player-1' } },
      create: { game_id: gameId, discord_id: 'player-1' },
      update: {},
    });
  });

  it('removes the player row on leave', async () => {
    dbMock.werewolf_players.findMany.mockResolvedValueOnce([]);

    await playerLeave(gameId, 'player-1');

    expect(dbMock.werewolf_players.deleteMany).toHaveBeenCalledWith({
      where: { game_id: gameId, discord_id: 'player-1' },
    });
  });
});
