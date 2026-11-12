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
  //   .where('user_id', userData.id);
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

  if (command === 'get') {
    for (const [key, value] of Object.entries(userData)) { // eslint-disable-line
      if (value !== null && value !== undefined && value !== '') {
        if (
          key === 'id'
        || key === 'discord_id'
        || key === 'discord_bot_ban'
        || key === 'ticket_ban'
        ) {
          continue; // eslint-disable-line
        }
        response += `**${key}**: ${value}\n`;
        if (key === 'roles') {
          response += stripIndents`\n(Note: Roles are only stored if you click the "needshelp" button so we can restore them later!)`;
        }
        if (key === 'mindset_role') {
          response += stripIndents`\nNote: Mindset role is only stored if you click a mindset role in the #start-here room.
          This is removed 8 hours after you click it automatically, same with Mindset Expires`;
        }
        if (key === 'mindset_role_expires_at') {
          response += stripIndents`\nNote: Mindset role is only stored if you click a mindset role in the #start-here room.
          This is removed 8 hours after you click it automatically, same with Mindset Role`;
        }
      }
    }

    // if (userActions.length > 0) {
    //   response += `User Actions: ${JSON.stringify(userActions)}`;
    // }
    if (userDrugDoses.length > 0) {
      response += `\n\nYou have ${userDrugDoses.length} Idose records. Use /idose get to see specifics!`;
    }
    if (userExperience.length > 0) {
      response += `\n\nYou have ${userExperience.length} experience records. Use /experience get to see specifics!`;
    }
    if (userReminders.length > 0) {
      response += `\n\nYou have ${userReminders.length} reminders. Use /reminders get to see specifics!`;
    }
    // if (userTickets.length > 0) {
    //   response += `\n\nYou have ${userTickets.length} tickets. Use /tickets get to see specifics!`;
    // }
  }
  if (command === 'delete') {
    userData.email = null;
    userData.username = null;
    userData.timezone = null;
    userData.birthday = null;
    userData.roles = '';
    userData.mindset_role = null;
    userData.mindset_role_expires_at = null;
    userData.lastfm_username = null;
    userData.irc_id = null;
    userData.matrix_id = null;
    userData.moodle_id = null;
    userData.password_hash = null;
    userData.level_freeze = null;
    userData.last_helper_activity = null;
    userData.last_was_helper = null;
    userData.karma_given = 0;
    userData.karma_received = 0;
    userData.sparkle_points = 0;
    userData.move_points = 0;
    userData.empathy_points = 0;
    userData.last_seen_at = SCRUBBED_LAST_SEEN;
    userData.last_seen_in = null;
    userData.joined_at = new Date(1970);
    userData.removed_at = null;

    await db.users.update({
      where: {
        id: userData.id,
      },
      data: userData,
    });
    await db.user_drug_doses.deleteMany({
      where: {
        user_id: userData.id,
      },
    });
    await db.user_experience.deleteMany({
      where: {
        user_id: userData.id,
      },
    });
    await db.user_reminders.deleteMany({
      where: {
        user_id: userData.id,
      },
    });

    // Everything else tied to the user goes too. Only moderation records (actions, appeals, bans), tickets (which
    // delete themselves shortly after archiving) and the bridge opt-out choice are kept.
    await db.quotes.deleteMany({ where: { user_id: userData.id } });
    await db.wordle_scores.deleteMany({ where: { user_id: userData.id } });
    await db.connections_scores.deleteMany({ where: { user_id: userData.id } });
    await db.mini_scores.deleteMany({ where: { user_id: userData.id } });
    await db.rpg_inventory.deleteMany({ where: { personas: { user_id: userData.id } } });
    await db.personas.deleteMany({ where: { user_id: userData.id } });
    // Deleting the AI record also removes its generated images and message usage records
    await db.ai_info.deleteMany({ where: { user_id: userData.id } });
    if (userData.discord_id) {
      await db.best_of.deleteMany({ where: { user_id: userData.discord_id } });
      await db.claimed_bounties.deleteMany({ where: { user_id: userData.discord_id } });
      await db.members.deleteMany({ where: { id: userData.discord_id } });
    }

    response = 'I deleted your User Data:\n';
      for (const [key, value] of Object.entries(userData)) { // eslint-disable-line
      if (value !== null && value !== undefined && value !== '') {
        if (
          key === 'id'
        || key === 'discord_id'
        || key === 'discord_bot_ban'
        || key === 'ticket_ban'
        ) {
          continue; // eslint-disable-line
        }
        response += `**${key}**: ${value}\n`;
      }
    }

    // if (userActions.length > 0) {
    //   response += `User Actions: ${JSON.stringify(userActions)}`;
    // }
    if (userDrugDoses.length > 0) {
      response += `\n\nI deleted ${userDrugDoses.length} Idose records!`;
    }
    if (userExperience.length > 0) {
      response += `\n\nI deleted ${userExperience.length} experience records!`;
    }
    if (userReminders.length > 0) {
      response += `\n\nI deleted ${userReminders.length} reminders!`;
    }
    response += '\n\nI also deleted your quotes, game scores, RPG character, AI data and linked accounts.';
    // if (userTickets.length > 0) {
    //   response += `\n\nI deleted ${userTickets.length} tickets!`;
    // }
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
