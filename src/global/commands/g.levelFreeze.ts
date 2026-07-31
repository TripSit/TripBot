import { MAX_EXPERIENCE_LEVEL, MIN_EXPERIENCE_LEVEL } from '../utils/experience';

const F = f(__filename);

/** The distinguished level */
export const NICE_LEVEL = 69;

/**
 * A "level freeze" pins the level shown for a user (profile, /levels, leaderboard) at a fixed cap.
 * It is DISPLAY-ONLY: XP keeps accruing and VIP roles / tent access still track the true level, so
 * removing the freeze restores the shown level instantly. Stored on `users.level_freeze`
 * (null = not frozen). BLAME RUUBERT FOR THIS FEATURE.
 */

export function isValidFreezeLevel(level: number): boolean {
  return Number.isInteger(level)
    && level >= MIN_EXPERIENCE_LEVEL
    && level <= MAX_EXPERIENCE_LEVEL;
}

export async function setLevelFreeze(discordId: string, level: number): Promise<void> {
  if (!isValidFreezeLevel(level)) {
    throw new RangeError(
      `Freeze level must be an integer between ${MIN_EXPERIENCE_LEVEL} and ${MAX_EXPERIENCE_LEVEL}.`,
    );
  }

  await db.users.upsert({
    where: { discord_id: discordId },
    create: { discord_id: discordId, level_freeze: level },
    update: { level_freeze: level },
  });

  log.debug(F, level === NICE_LEVEL
    ? `Froze ${discordId} at level ${level}. Nice. 😎`
    : `Froze ${discordId} at level ${level}`);
}

export async function removeLevelFreeze(discordId: string): Promise<boolean> {
  const { count } = await db.users.updateMany({
    where: { discord_id: discordId, level_freeze: { not: null } },
    data: { level_freeze: null },
  });

  if (count > 0) {
    log.debug(F, `Unfroze ${discordId}`);
  }
  return count > 0;
}

export async function getLevelFreeze(discordId: string): Promise<number | null> {
  const user = await db.users.findUnique({
    where: { discord_id: discordId },
    select: { level_freeze: true },
  });
  return user?.level_freeze ?? null;
}

export async function getAllLevelFreezes(): Promise<Array<{ discordId: string; frozenLevel: number }>> {
  const frozen = await db.users.findMany({
    where: { level_freeze: { not: null } },
    select: { discord_id: true, level_freeze: true },
    orderBy: { level_freeze: 'desc' },
  });

  return frozen
    .filter((user): user is { discord_id: string; level_freeze: number } => (
      user.discord_id !== null && user.level_freeze !== null
    ))
    .map(user => ({ discordId: user.discord_id, frozenLevel: user.level_freeze }));
}

export async function getLevelFreezes(discordIds: string[]): Promise<Map<string, number>> {
  if (discordIds.length === 0) {
    return new Map();
  }

  const frozenUsers = await db.users.findMany({
    where: { discord_id: { in: discordIds }, level_freeze: { not: null } },
    select: { discord_id: true, level_freeze: true },
  });

  return new Map(frozenUsers
    .filter((user): user is { discord_id: string; level_freeze: number } => (
      user.discord_id !== null && user.level_freeze !== null
    ))
    .map(user => [user.discord_id, user.level_freeze]));
}
