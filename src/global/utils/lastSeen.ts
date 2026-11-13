import type { users } from '@db/tripbot';

const F = f(__filename);

/** Don't write more often than this, so busy chatters cost at most one update an hour. */
export const LAST_SEEN_INTERVAL_MS = 1000 * 60 * 60;

/**
 * Records that a user was just active. The retention purge keys on users.last_seen_at, so this must be called
 * wherever a user shows up (messages, commands). Failures are logged, never thrown.
 */
export async function touchLastSeen(user: Pick<users, 'id' | 'last_seen_at'>): Promise<void> {
  try {
    if (Date.now() - user.last_seen_at.getTime() < LAST_SEEN_INTERVAL_MS) return;
    await db.users.update({ where: { id: user.id }, data: { last_seen_at: new Date() } });
  } catch (err) {
    log.error(F, `Failed to update last_seen_at for user ${user.id}: ${err}`);
  }
}
