import { DateTime } from 'luxon';
import {
  Prisma, werewolf_games, werewolf_night_action, werewolf_phase, werewolf_players, werewolf_role, werewolf_team,
} from '@db/tripbot';
import { werewolfRoleDef, werewolfRoleRegistry } from '../utils/werewolf/roles';
import { WerewolfGameWithPlayers } from '../utils/werewolf/types';

const F = f(__filename);

// Re-exported so tests can construct e.g. Prisma.PrismaClientKnownRequestError without importing
// '@db/tripbot' directly - Vitest's entry-file resolution doesn't reliably apply the tsconfig path
// alias to a *.test.ts file's own top-level runtime imports, only to modules it imports transitively.
export { Prisma };

export const werewolfRequiredPlayers = werewolfRoleDef('WOLF').minPlayers;
export const werewolfPhaseLengthSeconds = env.NODE_ENV === 'production' ? 5 * 60 : 10;

export async function gameGet(guildId: string): Promise<WerewolfGameWithPlayers | null> {
  return db.werewolf_games.findUnique({
    where: { guild_id: guildId },
    include: { werewolf_players: true },
  });
}

export async function gameGetById(gameId: string): Promise<WerewolfGameWithPlayers> {
  return db.werewolf_games.findUniqueOrThrow({
    where: { id: gameId },
    include: { werewolf_players: true },
  });
}

// Returns null if a game is already in progress for this guild - one active game per guild.
// The guild_id unique constraint is the real enforcement (two concurrent calls can both pass the
// existence check below); the constraint violation is caught here and treated the same as finding
// an existing game, so callers never see a raw DB error for this case.
export async function gameCreate(guildId: string, channelId: string): Promise<werewolf_games | null> {
  const existing = await gameGet(guildId);
  if (existing) return null;

  try {
    return await db.werewolf_games.create({
      data: {
        guild_id: guildId,
        channel_id: channelId,
        wolfden_channel_id: env.CHANNEL_WOLFDEN || null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return null;
    throw err;
  }
}

export async function playerJoin(gameId: string, discordId: string): Promise<werewolf_players[]> {
  await db.werewolf_players.upsert({
    where: { game_id_discord_id: { game_id: gameId, discord_id: discordId } },
    create: { game_id: gameId, discord_id: discordId },
    update: {},
  });
  return db.werewolf_players.findMany({ where: { game_id: gameId } });
}

export async function playerLeave(gameId: string, discordId: string): Promise<werewolf_players[]> {
  await db.werewolf_players.deleteMany({ where: { game_id: gameId, discord_id: discordId } });
  return db.werewolf_players.findMany({ where: { game_id: gameId } });
}

/**
 * Assigns roles for a game. Extensible by design: adding a future role is a single entry in
 * werewolfRoleRegistry (src/global/utils/werewolf/roles.ts) - this function never needs to change.
 */
export function assignRoles(playerIds: string[]): { discord_id: string; role: werewolf_role; team: werewolf_team }[] {
  const shuffled = [...playerIds];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const assignments: { discord_id: string; role: werewolf_role; team: werewolf_team }[] = [];
  let remaining = shuffled;

  werewolfRoleRegistry
    .filter(def => def.role !== 'VILLAGER')
    .forEach(def => {
      if (playerIds.length < def.minPlayers) return;
      const count = def.count(playerIds.length);
      const claimed = remaining.slice(0, count);
      remaining = remaining.slice(count);
      claimed.forEach(discordId => assignments.push({ discord_id: discordId, role: def.role, team: def.team }));
    });

  const villagerDef = werewolfRoleDef('VILLAGER');
  remaining.forEach(discordId => assignments.push({
    discord_id: discordId, role: villagerDef.role, team: villagerDef.team,
  }));

  return assignments;
}

export async function gameStart(gameId: string): Promise<werewolf_players[]> {
  const game = await gameGetById(gameId);
  const assignments = assignRoles(game.werewolf_players.map(p => p.discord_id));

  await Promise.all(assignments.map(a => db.werewolf_players.update({
    where: { game_id_discord_id: { game_id: gameId, discord_id: a.discord_id } },
    data: { role: a.role, team: a.team },
  })));

  await db.werewolf_games.update({
    where: { id: gameId },
    data: {
      phase: 'NIGHT',
      day: 1,
      phase_end_time: DateTime.now().plus({ seconds: werewolfPhaseLengthSeconds }).toJSDate(),
    },
  });

  return db.werewolf_players.findMany({ where: { game_id: gameId } });
}

export async function castVote(
  gameId: string,
  day: number,
  phase: werewolf_phase,
  voterId: string,
  targetId: string,
): Promise<void> {
  await db.werewolf_votes.upsert({
    where: {
      game_id_day_phase_voter_id: {
        game_id: gameId, day, phase, voter_id: voterId,
      },
    },
    create: {
      game_id: gameId, day, phase, voter_id: voterId, target_id: targetId,
    },
    update: { target_id: targetId },
  });
}

// Returns the top-voted target, or null on a tie / no votes (no one dies).
export async function tallyVotes(gameId: string, day: number, phase: werewolf_phase): Promise<string | null> {
  const grouped = await db.werewolf_votes.groupBy({
    by: ['target_id'],
    where: { game_id: gameId, day, phase },
    _count: { target_id: true },
  });

  const votes = grouped
    .map(({ target_id: targetId, _count: count }) => ({ targetId, count: count.target_id }))
    .sort((a, b) => b.count - a.count);

  if (votes.length === 0) return null;
  if (votes.length > 1 && votes[0].count === votes[1].count) return null;

  return votes[0].targetId;
}

// Seer's peek and Doctor's protect both upsert here - one action per actor per night. Hunter's
// revenge also writes here (naturally at-most-once, since `day` pins it to the single day they died).
export async function castNightAction(
  gameId: string,
  day: number,
  action: werewolf_night_action,
  actorId: string,
  targetId: string,
): Promise<void> {
  await db.werewolf_night_actions.upsert({
    where: {
      game_id_day_action_actor_id: {
        game_id: gameId, day, action, actor_id: actorId,
      },
    },
    create: {
      game_id: gameId, day, action, actor_id: actorId, target_id: targetId,
    },
    update: { target_id: targetId },
  });
}

export async function getNightActionTarget(
  gameId: string,
  day: number,
  action: werewolf_night_action,
  actorId: string,
): Promise<string | null> {
  const row = await db.werewolf_night_actions.findUnique({
    where: {
      game_id_day_action_actor_id: {
        game_id: gameId, day, action, actor_id: actorId,
      },
    },
  });
  return row?.target_id ?? null;
}

// Records the peek and returns the target's team immediately - unlike votes, this doesn't need to
// wait for the night to end since it's a single actor's private information, not a group tally.
export async function seerPeek(
  gameId: string,
  day: number,
  seerDiscordId: string,
  targetDiscordId: string,
): Promise<werewolf_team> {
  await castNightAction(gameId, day, 'PEEK', seerDiscordId, targetDiscordId);
  const target = await db.werewolf_players.findUniqueOrThrow({
    where: { game_id_discord_id: { game_id: gameId, discord_id: targetDiscordId } },
  });
  return target.team;
}

export async function protectTarget(
  gameId: string,
  day: number,
  doctorDiscordId: string,
  targetDiscordId: string,
): Promise<void> {
  await castNightAction(gameId, day, 'PROTECT', doctorDiscordId, targetDiscordId);
}

// updateMany (not update) on purpose: a stale Kill button from a previous, already-ended game can
// still be clicked and cast a vote for a target that isn't a living player in the current game. A
// plain .update() would throw "record not found" on every timer retry and permanently wedge the
// game; updateMany just matches zero rows and we treat that the same as no valid winner.
export async function resolveNightKill(
  gameId: string,
  day: number,
): Promise<{ victimId: string | null; wasProtected: boolean }> {
  const votedTargetId = await tallyVotes(gameId, day, 'NIGHT');
  if (!votedTargetId) return { victimId: null, wasProtected: false };

  const protectedRow = await db.werewolf_night_actions.findFirst({
    where: {
      game_id: gameId, day, action: 'PROTECT', target_id: votedTargetId,
    },
  });
  if (protectedRow) return { victimId: null, wasProtected: true };

  const result = await db.werewolf_players.updateMany({
    where: {
      game_id: gameId, discord_id: votedTargetId, is_alive: true,
    },
    data: { is_alive: false, killed_on_day: day },
  });
  if (result.count === 0) return { victimId: null, wasProtected: false };

  return { victimId: votedTargetId, wasProtected: false };
}

export async function resolveDayHang(gameId: string, day: number): Promise<string | null> {
  const suspectId = await tallyVotes(gameId, day, 'AFTERNOON');
  if (!suspectId) return null;

  const result = await db.werewolf_players.updateMany({
    where: {
      game_id: gameId, discord_id: suspectId, is_alive: true,
    },
    data: { is_alive: false, hung_on_day: day },
  });
  if (result.count === 0) return null;

  return suspectId;
}

// A dead Hunter can take one other living player down with them, whenever they get around to
// clicking - no time limit. Guarded so a double-click (or a stale button from a finished game)
// can't fire twice: the REVENGE row is only ever created once per (game, day, actor) thanks to the
// same unique constraint PEEK/PROTECT use, and a second attempt just fails the P2002 catch below and
// returns false instead of throwing.
export async function resolveHunterRevenge(
  gameId: string,
  day: number,
  hunterDiscordId: string,
  targetDiscordId: string,
): Promise<boolean> {
  const hunter = await db.werewolf_players.findUnique({
    where: { game_id_discord_id: { game_id: gameId, discord_id: hunterDiscordId } },
  });
  if (!hunter || hunter.role !== 'HUNTER' || hunter.is_alive) return false;

  try {
    await db.werewolf_night_actions.create({
      data: {
        game_id: gameId, day, action: 'REVENGE', actor_id: hunterDiscordId, target_id: targetDiscordId,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return false;
    throw err;
  }

  const result = await db.werewolf_players.updateMany({
    where: {
      game_id: gameId, discord_id: targetDiscordId, is_alive: true,
    },
    data: { is_alive: false, killed_on_day: day },
  });

  return result.count > 0;
}

// Only ever looks at team, so it generalizes automatically to any future role. Wolves win once they
// reach parity with the town (not just when town hits zero) - from that point town can never win a
// fair vote even with perfect play, so standard Mafia/Werewolf rules treat it as already decided.
export async function checkWinCondition(gameId: string): Promise<werewolf_team | null> {
  const [wolvesAlive, townAlive] = await Promise.all([
    db.werewolf_players.count({ where: { game_id: gameId, team: 'WOLVES', is_alive: true } }),
    db.werewolf_players.count({ where: { game_id: gameId, team: 'TOWN', is_alive: true } }),
  ]);

  if (wolvesAlive === 0) return 'TOWN';
  if (wolvesAlive >= townAlive) return 'WOLVES';
  return null;
}

export async function diaryAdd(gameId: string, discordId: string, day: number, entry: string): Promise<void> {
  await db.werewolf_diary_entries.create({
    data: {
      game_id: gameId, discord_id: discordId, day, entry,
    },
  });
}

export async function diaryGet(gameId: string, discordId: string, day: number): Promise<string[]> {
  const entries = await db.werewolf_diary_entries.findMany({
    where: { game_id: gameId, discord_id: discordId, day },
    orderBy: { created_at: 'asc' },
  });
  return entries.map(entry => entry.entry);
}

export async function gameAdvancePhase(
  gameId: string,
  nextPhase: werewolf_phase,
  options: { incrementDay?: boolean; phaseLengthSeconds?: number; winningTeam?: werewolf_team } = {},
): Promise<werewolf_games> {
  const {
    incrementDay = false, phaseLengthSeconds = werewolfPhaseLengthSeconds, winningTeam,
  } = options;

  log.debug(F, `Advancing werewolf game ${gameId} to ${nextPhase}`);

  return db.werewolf_games.update({
    where: { id: gameId },
    data: {
      phase: nextPhase,
      phase_end_time: DateTime.now().plus({ seconds: phaseLengthSeconds }).toJSDate(),
      ...(incrementDay ? { day: { increment: 1 } } : {}),
      ...(winningTeam ? { winning_team: winningTeam } : {}),
    },
  });
}

export async function gameSetMessageId(gameId: string, messageId: string): Promise<void> {
  await db.werewolf_games.update({ where: { id: gameId }, data: { message_id: messageId } });
}

export async function gameSetWolfMessageId(gameId: string, messageId: string): Promise<void> {
  await db.werewolf_games.update({ where: { id: gameId }, data: { wolf_message_id: messageId } });
}

// Deletes the game row - per design, no history is retained once a game ends.
export async function gameEnd(gameId: string): Promise<void> {
  await db.werewolf_games.delete({ where: { id: gameId } });
}
