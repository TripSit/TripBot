/* eslint-disable max-len */
import { stripIndents } from 'common-tags';
import { getOrCreateUser } from '../utils/dbRecords';

const F = f(__filename);

export default privacy;

/** Users not seen for this long, and not banned, have their data purged (see /privacy delete). */
export const RETENTION_MONTHS = 6;

/** Moderation actions are pruned after this period unless they concern a currently banned user. */
export const MODERATION_ACTION_RETENTION_YEARS = 2;

/** Legacy marker for accounts scrubbed by earlier versions; these rows are skipped by the purge. */
export const SCRUBBED_LAST_SEEN = new Date(1970);

/** Plain values keep their usual text; structured values are serialized instead of printing "[object Object]". */
function formatValue(value: unknown): string {
  if (value === null || value instanceof Date || typeof value !== 'object') {
    return String(value);
  }
  return JSON.stringify(value);
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
type RecordCounts = {
  doses: number; experience: number; reminders: number; tickets: number; appeals: number; bestOf: number;
};
/** Returns the Discord IDs currently banned from a guild, or null when the complete list cannot be read. */
export type FetchGuildBanIds = (guildId: string) => Promise<Set<string> | null>;
export type DeleteDiscordData = (
  discordId: string,
  channelIds: string[],
  bestOfMessageIds: string[],
  moderationLogChannelIds: string[],
) => Promise<void>;

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

async function deleteUserRecords(tx: TransactionClient, userData: UserRecord, discordId: string | null): Promise<void> {
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
  await tx.watch_request.deleteMany({
    where: discordId ? {
      OR: [
        { usersId: userData.id },
        { caller_id: discordId },
        { watched_user_id: discordId },
      ],
    } : { usersId: userData.id },
  });

  // Remove user-authored quote records too, even when they quote somebody else.
  await tx.quotes.deleteMany({ where: { OR: [{ user_id: userData.id }, { created_by: userData.id }] } });
  await tx.wordle_scores.deleteMany({ where: { user_id: userData.id } });
  await tx.connections_scores.deleteMany({ where: { user_id: userData.id } });
  await tx.mini_scores.deleteMany({ where: { user_id: userData.id } });
  await tx.rpg_inventory.deleteMany({ where: { personas: { user_id: userData.id } } });
  await tx.personas.deleteMany({ where: { user_id: userData.id } });
  await tx.ai_info.deleteMany({ where: { user_id: userData.id } });
  // Remove this person's moderation history and unlink their moderator identity from other people's records.
  await tx.user_actions.updateMany({
    where: { created_by: userData.id, NOT: { user_id: userData.id } },
    data: { created_by: null, internal_note: '', description: null },
  });
  await tx.user_actions.updateMany({
    where: { OR: [{ repealed_by: userData.id }, { ban_evasion_related_user: userData.id }] },
    data: { repealed_by: null, ban_evasion_related_user: null },
  });
  // No ban record about this person may remain, so this includes a temporary ban that has not ended. Without its
  // timer TripBot cannot lift that ban automatically; it stays until a moderator lifts it, as the user is warned.
  await tx.user_actions.deleteMany({
    where: {
      OR: [
        { user_id: userData.id },
        ...(discordId ? [{ target_discord_id: discordId }] : []),
      ],
    },
  });

  // Ticket ownership and appeal content are user data.
  await tx.user_tickets.updateMany({
    where: { OR: [{ closed_by: userData.id }, { reopened_by: userData.id }] },
    data: { closed_by: null, reopened_by: null },
  });
  await tx.user_tickets.deleteMany({ where: { user_id: userData.id } });
  await tx.appeals.deleteMany({ where: { user_id: userData.id } });
  await tx.drug_articles.updateMany({
    where: { OR: [{ posted_by: userData.id }, { last_modified_by: userData.id }] },
    data: {
      posted_by: null,
      last_modified_by: null,
    },
  });
  await tx.drug_variants.updateMany({ where: { last_updated_by: userData.id }, data: { last_updated_by: null } });
  await tx.drugs.updateMany({ where: { last_updated_by: userData.id }, data: { last_updated_by: null } });
  if (discordId) {
    await tx.best_of.deleteMany({ where: { user_id: discordId } });
    await tx.claimed_bounties.deleteMany({ where: { user_id: discordId } });
    await tx.members.deleteMany({ where: { id: discordId } });
  }
  await tx.users.delete({ where: { id: userData.id } });
}

function describeStoredData(userData: UserRecord, counts: RecordCounts): string {
  let response = describeUserData(userData, true);
  if (counts.doses > 0) {
    response += `\n\nYou have ${counts.doses} Idose records. Use /idose get to see specifics!`;
  }
  if (counts.experience > 0) {
    response += `\n\nYou have ${counts.experience} experience records. Use /levels to see your levels!`;
  }
  if (counts.reminders > 0) {
    response += `\n\nYou have ${counts.reminders} reminders. Use /remind_me get to see specifics!`;
  }
  if (counts.tickets > 0) response += `\n\nYou have ${counts.tickets} support ticket lifecycle records and any remaining Discord threads.`;
  if (counts.appeals > 0) response += `\n\nYou have ${counts.appeals} moderation appeal records.`;
  if (counts.bestOf > 0) response += `\n\nYou have ${counts.bestOf} saved messages in the Best Of archive.`;
  return response;
}

function describeDeletedData(counts: RecordCounts): string {
  let response = 'I removed your TripBot profile data and feature data.';
  if (counts.doses > 0) {
    response += `\n\nI deleted ${counts.doses} Idose records!`;
  }
  if (counts.experience > 0) {
    response += `\n\nI deleted ${counts.experience} experience records!`;
  }
  if (counts.reminders > 0) {
    response += `\n\nI deleted ${counts.reminders} reminders!`;
  }
  if (counts.tickets > 0) response += `\n\nI deleted ${counts.tickets} support ticket records and Discord threads.`;
  if (counts.appeals > 0) response += `\n\nI deleted ${counts.appeals} moderation appeal records.`;
  if (counts.bestOf > 0) response += `\n\nI removed ${counts.bestOf} saved messages from the Best Of archive.`;
  response += '\n\nI also deleted your quotes, game scores, RPG character, linked accounts, tickets, appeals, moderation history, and their Discord threads. Your moderator identity and notes on other moderation records were anonymized. TripBot kept no ban records about you: if you had a temporary Discord ban, its timer was deleted too, so that ban stays in place until a moderator lifts it. Command usage is retained only as aggregate totals and the most recent use time per command, without user, guild, channel, or option data. Discord-managed bans are not changed by this command. Copies already relayed to IRC and data in service logs or backups may remain as described in our privacy policy.';
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
  deleteDiscordData?: DeleteDiscordData,
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
  const userTickets = await db.user_tickets.findMany({
    where: { user_id: userData.id },
    select: { thread_id: true, meta_thread_id: true },
  });
  const userAppeals = await db.appeals.findMany({ where: { user_id: userData.id }, select: { id: true } });
  const userBestOf = userData.discord_id ? await db.best_of.findMany({
    where: { user_id: userData.discord_id },
    select: { message_id: true },
  }) : [];
  const counts = {
    doses: userDrugDoses.length,
    experience: userExperience.length,
    reminders: userReminders.length,
    tickets: userTickets.length,
    appeals: userAppeals.length,
    bestOf: userBestOf.length,
  };

  if (command === 'get') {
    response = describeStoredData(userData, counts);
  }
  if (command === 'delete') {
    const discordId = userData.discord_id;
    const discordChannelIds = [...new Set([
      userData.mod_thread_id,
      ...userTickets.flatMap(ticket => [ticket.thread_id, ticket.meta_thread_id]),
    ].filter((id): id is string => Boolean(id)))];
    if (deleteDiscordData) {
      const moderationLogChannels = await db.discord_guilds.findMany({
        where: { channel_mod_log: { not: null } },
        select: { channel_mod_log: true },
      });
      const moderationLogChannelIds = [...new Set(moderationLogChannels
        .map(guild => guild.channel_mod_log)
        .filter((id): id is string => Boolean(id)))];
      await deleteDiscordData(
        userId,
        discordChannelIds,
        userBestOf.map(entry => entry.message_id),
        moderationLogChannelIds,
      );
    } else if (discordChannelIds.length > 0) throw new Error('Discord thread cleanup is required before deleting user data');
    // Keep the data deletion and all dependent-record cleanup atomic.
    await db.$transaction(async tx => {
      await deleteUserRecords(tx, userData, discordId);
    });

    response = describeDeletedData(counts);
  }

  log.info(F, `privacy ${command} completed`);
  return response;
}

/**
 * Enforces the retention promised by /privacy delete: users who haven't been seen for RETENTION_MONTHS and have
 * no unrepealed full ban have their data removed like a manual delete.
 * Banned users stay on file. Returns how many users were purged.
 */
export async function purgeInactiveUsers(
  now: Date = new Date(),
  deleteDiscordData?: DeleteDiscordData,
): Promise<number> {
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
      await privacy('delete', user.discord_id, deleteDiscordData); // eslint-disable-line no-await-in-loop
      purged += 1;
    } catch {
      log.error(F, 'Retention purge failed for one account');
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

type UnrepealedBan = {
  id: string;
  guild_id: string;
  user_id: string | null;
  target_discord_id: string | null;
  users_user_actions_user_idTousers: { discord_id: string | null } | null;
};

/** Repeals (or, for timer-only records left by /privacy delete, deletes) bans that Discord no longer enforces. */
async function repealLiftedBans(bans: UnrepealedBan[], bannedIds: Set<string>, now: Date): Promise<number> {
  const lifted = bans.filter(ban => {
    const discordId = ban.target_discord_id ?? ban.users_user_actions_user_idTousers?.discord_id;
    return Boolean(discordId) && !bannedIds.has(discordId as string);
  });
  // A record without a user only exists to lift its ban, so it has nothing left to do.
  const timerOnlyIds = lifted.filter(ban => !ban.user_id).map(ban => ban.id);
  const repealIds = lifted.filter(ban => ban.user_id).map(ban => ban.id);
  if (timerOnlyIds.length > 0) {
    await db.user_actions.deleteMany({ where: { id: { in: timerOnlyIds }, user_id: null, repealed_at: null } });
  }
  if (repealIds.length > 0) {
    await db.user_actions.updateMany({ where: { id: { in: repealIds }, repealed_at: null }, data: { repealed_at: now } });
  }
  return lifted.length;
}

/**
 * Marks full bans that Discord no longer enforces as repealed, so only users who are still banned stay out of the
 * inactive-account purge and moderation-history pruning. This covers temporary bans lifted by older versions (which
 * only cleared the expiry) and bans lifted directly in Discord. A guild whose ban list cannot be read is left as is.
 * Returns how many ban records were updated.
 */
export async function reconcileLiftedBans(
  fetchGuildBanIds: FetchGuildBanIds,
  now: Date = new Date(),
): Promise<number> {
  const unrepealed = await db.user_actions.findMany({
    where: { type: 'FULL_BAN', repealed_at: null },
    select: {
      id: true,
      guild_id: true,
      user_id: true,
      target_discord_id: true,
      users_user_actions_user_idTousers: { select: { discord_id: true } },
    },
  });

  const byGuild = new Map<string, UnrepealedBan[]>();
  unrepealed.forEach(ban => byGuild.set(ban.guild_id, [...(byGuild.get(ban.guild_id) ?? []), ban]));

  let reconciled = 0;
  for (const [guildId, bans] of byGuild) { // eslint-disable-line no-restricted-syntax
    const bannedIds = await fetchGuildBanIds(guildId); // eslint-disable-line no-await-in-loop
    if (!bannedIds) continue; // eslint-disable-line no-continue
    reconciled += await repealLiftedBans(bans, bannedIds, now); // eslint-disable-line no-await-in-loop
  }

  log.info(F, `Reconciled ${reconciled} of ${unrepealed.length} unrepealed full bans with Discord`);
  return reconciled;
}
