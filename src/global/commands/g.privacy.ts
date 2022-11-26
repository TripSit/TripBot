/* eslint-disable max-len */
import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { db, getUser } from '../utils/knex';
import {
  UserDrugDoses,
  UserExperience,
  UserReminders,
  Users,
  UserTickets,
} from '../@types/pgdb';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default privacy;

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
  const userData = await getUser(userId, null);
  // const userActions = await db<UserActions>('user_actions')
  //   .where('user_id', userData.id);
  const userDrugDoses = await db<UserDrugDoses>('user_drug_doses')
    .where('user_id', userData.id);
  const userExperience = await db<UserExperience>('user_experience')
    .where('user_id', userData.id);
  const userReminders = await db<UserReminders>('user_reminders')
    .where('user_id', userData.id);
  const userTickets = await db<UserTickets>('user_tickets')
    .where('user_id', userData.id);

  if (command === 'get') {
    response = '';
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
    if (userTickets.length > 0) {
      response += `\n\nYou have ${userTickets.length} tickets. Use /tickets get to see specifics!`;
    }
  }
  if (command === 'delete') {
    const blankUser = {
      email: null,
      username: null,
      timezone: null,
      birthday: null,
      roles: '',
      mindset_role: null,
      mindset_role_expires_at: null,
      karma_given: 0,
      karma_received: 0,
      sparkle_points: 0,
      move_points: 0,
      empathy_points: 0,
      last_seen_at: undefined,
      last_seen_in: null,
      joined_at: undefined,
      removed_at: null,
    };
    await db<Users>('users')
      .where('id', userData.id)
      .update(blankUser);

    await db<UserDrugDoses>('user_drug_doses')
      .where('user_id', userData.id)
      .del();
    await db<UserExperience>('user_experience')
      .where('user_id', userData.id)
      .del();
    await db<UserReminders>('user_reminders')
      .where('user_id', userData.id)
      .del();
    await db<UserTickets>('user_tickets')
      .where('user_id', userData.id)
      .del();

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
    if (userTickets.length > 0) {
      response += `\n\nI deleted ${userTickets.length} tickets!`;
    }
  }

  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
