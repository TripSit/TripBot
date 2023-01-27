/* eslint-disable max-len */
import { stripIndents } from 'common-tags';
import {
  experienceDel,
  experienceGet, getUser, idoseDel, idoseGet, reminderDel, reminderGet, usersUpdate,
} from '../utils/knex';

const F = f(__filename);

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
  const userDrugDoses = await idoseGet(userData.id);
  const userExperience = await experienceGet(userData.id);
  const userReminders = await reminderGet(userData.id);
  // const userTickets = await db<UserTickets>('user_tickets')
  //   .where('user_id', userData.id);

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
    userData.karma_given = 0;
    userData.karma_received = 0;
    userData.sparkle_points = 0;
    userData.move_points = 0;
    userData.empathy_points = 0;
    userData.last_seen_at = new Date(1970);
    userData.last_seen_in = null;
    userData.joined_at = new Date(1970);
    userData.removed_at = null;

    await usersUpdate(userData);
    await idoseDel(undefined, userData.id);
    await experienceDel(userData.id);
    await reminderDel(undefined, userData.id);

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
    // if (userTickets.length > 0) {
    //   response += `\n\nI deleted ${userTickets.length} tickets!`;
    // }
  }

  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
