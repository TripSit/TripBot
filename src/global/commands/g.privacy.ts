/* eslint-disable max-len */
import { stripIndents } from 'common-tags';
import { getOrCreateUser } from '../utils/dbRecords';

const F = f(__filename);

export default privacy;

/** Users not seen for this long, and not banned, have their data purged (see /privacy delete). */
export const RETENTION_MONTHS = 6;

/** Command parameter values are kept this many days for usage stats, then deleted. */
export const COMMAND_PARAMETER_RETENTION_DAYS = 90;

/** Moderation actions other than permanent bans are kept this long, counted from the date of the action. */
export const MODERATION_ACTION_RETENTION_YEARS = 2;

/** The last_seen_at that privacy('delete') writes; scrubbed users are skipped by the purge. */
export const SCRUBBED_LAST_SEEN = new Date(1970);

/** Plain values keep their usual text; structured values are serialized instead of printing "[object Object]". */
function formatValue(value: unknown): string {
  if (value === null || value instanceof Date || typeof value !== 'object') {
    return String(value);
  }
  return JSON.stringify(value);
}

/** Turns relaying of a user's Discord messages to IRC off (or back on). Returns the stored value. */
export async function setIrcBridgeOptOut(discordId: string, optOut: boolean): Promise<boolean> {
  const userData = await getOrCreateUser(discordId);
  const updated = await db.users.update({
    where: { id: userData.id },
    data: { irc_bridge_opt_out: optOut },
  });
  log.info(F, `irc bridge opt-out set to ${updated.irc_bridge_opt_out} for user ${userData.id}`);
  return updated.irc_bridge_opt_out;
}

// Fields that are never listed back to the user
const HIDDEN_FIELDS = ['id', 'discord_id', 'discord_bot_ban', 'ticket_ban'];

const FIELD_NOTES: Record<string, string> = {
  roles: stripIndents`\n(Note: Roles are only stored if you click the "needshelp" button so we can restore them later!)`,
  mindset_role: stripIndents`\nNote: Mindset role is only stored if you click a mindset role in the #start-here room.
          This is removed 8 hours after you click it automatically, same with Mindset Expires`,
  mindset_role_expires_at: stripIndents`\nNote: Mindset role is only stored if you click a mindset role in the #start-here room.
          This is removed 8 hours after you click it automatically, same with Mindset Role`,
};

type UserRecord = Awaited<ReturnType<typeof getOrCreateUser>>;
type TransactionClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];
type RecordCounts = { doses: number; experience: number; reminders: number };

/** Lists the stored (non-empty, non-hidden) fields of a user, optionally with an explanatory note per field. */
function describeUserData(userData: UserRecord, includeNotes: boolean): string {
  let text = '';
  Object.entries(userData).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    if (HIDDEN_FIELDS.includes(key)) return;
    text += `**${key}**: ${formatValue(value)}\n`;
    if (includeNotes && key in FIELD_NOTES) {
      text += FIELD_NOTES[key];
    }
  });
  return text;
}

function scrubUserData(userData: UserRecord): void {
  Object.assign(userData, {
    email: null,
    username: null,
    timezone: null,
    birthday: null,
    roles: '',
    mindset_role: null,
    mindset_role_expires_at: null,
    lastfm_username: null,
    irc_id: null,
    matrix_id: null,
    moodle_id: null,
    password_hash: null,
    level_freeze: null,
    last_helper_activity: null,
    last_was_helper: null,
    karma_given: 0,
    karma_received: 0,
    sparkle_points: 0,
    move_points: 0,
    empathy_points: 0,
    last_seen_at: SCRUBBED_LAST_SEEN,
    last_seen_in: null,
    joined_at: new Date(1970),
    removed_at: null,
  });
}

async function deleteUserRecords(tx: TransactionClient, userData: UserRecord): Promise<void> {
  await tx.users.update({
    where: {
      id: userData.id,
    },
    data: userData,
  });
  await tx.user_drug_doses.deleteMany({
    where: {
      user_id: userData.id,
    },
  });
  await tx.user_experience.deleteMany({
    where: {
      user_id: userData.id,
    },
  });
  await tx.user_reminders.deleteMany({
    where: {
      user_id: userData.id,
    },
  });

  // Everything else tied to the user goes too. Only moderation records (actions, appeals, bans), tickets (which
  // delete themselves shortly after archiving) and the bridge opt-out choice are kept.
  await tx.quotes.deleteMany({ where: { user_id: userData.id } });
  await tx.wordle_scores.deleteMany({ where: { user_id: userData.id } });
  await tx.connections_scores.deleteMany({ where: { user_id: userData.id } });
  await tx.mini_scores.deleteMany({ where: { user_id: userData.id } });
  await tx.rpg_inventory.deleteMany({ where: { personas: { user_id: userData.id } } });
  await tx.personas.deleteMany({ where: { user_id: userData.id } });
  // Deleting the AI record also removes its generated images and message usage records
  await tx.ai_info.deleteMany({ where: { user_id: userData.id } });
  if (userData.discord_id) {
    await tx.best_of.deleteMany({ where: { user_id: userData.discord_id } });
    await tx.claimed_bounties.deleteMany({ where: { user_id: userData.discord_id } });
    await tx.members.deleteMany({ where: { id: userData.discord_id } });
  }
}

function describeStoredData(userData: UserRecord, counts: RecordCounts): string {
  let response = describeUserData(userData, true);
  if (counts.doses > 0) {
    response += `\n\nYou have ${counts.doses} Idose records. Use /idose get to see specifics!`;
  }
  if (counts.experience > 0) {
    response += `\n\nYou have ${counts.experience} experience records. Use /experience get to see specifics!`;
  }
  if (counts.reminders > 0) {
    response += `\n\nYou have ${counts.reminders} reminders. Use /reminders get to see specifics!`;
  }
  return response;
}

function describeDeletedData(userData: UserRecord, counts: RecordCounts): string {
  let response = `I deleted your User Data:\n${describeUserData(userData, false)}`;
  if (counts.doses > 0) {
    response += `\n\nI deleted ${counts.doses} Idose records!`;
  }
  if (counts.experience > 0) {
    response += `\n\nI deleted ${counts.experience} experience records!`;
  }
  if (counts.reminders > 0) {
    response += `\n\nI deleted ${counts.reminders} reminders!`;
  }
  response += '\n\nI also deleted your quotes, game scores, RPG character, AI data and linked accounts.';
  return response;
}

/**
 *
 * @param {'get' | 'delete'} command
 * @return {any}
 */
export async function privacy(
  command: 'get' | 'delete',
  userId: string,
):Promise<string> {
  let response = '';
  const userData = await getOrCreateUser(userId);
  const userDrugDoses = await db.user_drug_doses.findMany({
    where: {
      user_id: userData.id,
    },
  });
  const userExperience = await db.user_experience.findMany({
    where: {
      user_id: userData.id,
    },
  });

  const userReminders = await db.user_reminders.findMany({
    where: {
      user_id: userData.id,
    },
  });
  const counts = {
    doses: userDrugDoses.length,
    experience: userExperience.length,
    reminders: userReminders.length,
  };

  if (command === 'get') {
    response = describeStoredData(userData, counts);
  }
  if (command === 'delete') {
    scrubUserData(userData);

    // Keep the scrub marker and related deletions atomic so failed purges remain retryable.
    await db.$transaction(async tx => {
      await deleteUserRecords(tx, userData);
    });

    response = describeDeletedData(userData, counts);
  }

  log.info(F, `privacy ${command} completed for user ${userData.id}`);
  return response;
}

/**
 * Enforces the retention promised by /privacy delete: users who haven't been seen for RETENTION_MONTHS and have
 * no unrepealed full ban are scrubbed like a manual delete. Moderation actions are not removed here; they follow
 * their own retention (see pruneModerationActions) so a returning user's history is still available.
 * Banned users stay on file. Returns how many users were purged.
 */
export async function purgeInactiveUsers(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - RETENTION_MONTHS);

  const inactive = await db.users.findMany({
    where: {
      discord_id: { not: null },
      last_seen_at: { lt: cutoff, gt: SCRUBBED_LAST_SEEN },
      user_actions_user_actions_user_idTousers: { none: { type: 'FULL_BAN', repealed_at: null } },
    },
    select: { id: true, discord_id: true },
  });

  let purged = 0;
  for (const user of inactive) { // eslint-disable-line no-restricted-syntax
    if (!user.discord_id) continue; // eslint-disable-line no-continue
    try {
      await privacy('delete', user.discord_id); // eslint-disable-line no-await-in-loop
      purged += 1;
    } catch (err) {
      log.error(F, `Retention purge failed for user ${user.id}: ${err}`);
    }
  }

  log.info(F, `Retention purge removed data for ${purged} of ${inactive.length} inactive users`);
  return purged;
}

/**
 * Deletes moderation actions older than MODERATION_ACTION_RETENTION_YEARS. Permanent bans (full bans and ban
 * evasion) and every action against a user who is currently fully banned are kept.
 */
export async function pruneModerationActions(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - MODERATION_ACTION_RETENTION_YEARS);
  const { count } = await db.user_actions.deleteMany({
    where: {
      created_at: { lt: cutoff },
      type: { notIn: ['FULL_BAN', 'BAN_EVASION'] },
      users_user_actions_user_idTousers: {
        is: { user_actions_user_actions_user_idTousers: { none: { type: 'FULL_BAN', repealed_at: null } } },
      },
    },
  });
  log.info(F, `Pruned ${count} moderation actions older than ${MODERATION_ACTION_RETENTION_YEARS} years`);
  return count;
}

/** Deletes command parameters older than COMMAND_PARAMETER_RETENTION_DAYS; the command counts themselves stay. */
export async function pruneCommandParameters(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - COMMAND_PARAMETER_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await db.command_usage_parameter.deleteMany({
    where: { usage: { created_at: { lt: cutoff } } },
  });
  log.info(F, `Pruned ${count} command parameters older than ${COMMAND_PARAMETER_RETENTION_DAYS} days`);
  return count;
}
