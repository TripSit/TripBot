import { parse } from 'path';
import { db, getUser } from '../utils/knex';
import {
  UserActions,
  UserDrugDoses,
  UserExperience,
  UserReminders,
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
  const userActions = await db<UserActions>('user_actions')
    .where('user_id', userData.id);
  const userDrugDoses = await db<UserDrugDoses>('user_drug_doses')
    .where('user_id', userData.id);
  const userExperience = await db<UserExperience>('user_experience')
    .where('user_id', userData.id);
  const userReminders = await db<UserReminders>('user_reminders')
    .where('user_id', userData.id);
  const userTickets = await db<UserTickets>('user_tickets')
    .where('user_id', userData.id);

  if (command === 'delete') {
    // test
  }
  if (command === 'get') {
    response = `User Data: ${JSON.stringify(userData)}`;
    if (userActions.length > 0) {
      response += `User Actions: ${JSON.stringify(userActions)}`;
    }
    if (userDrugDoses.length > 0) {
      response += `User Drug Doses: ${JSON.stringify(userDrugDoses)}`;
    }
    if (userExperience.length > 0) {
      response += `User Experience: ${JSON.stringify(userExperience)}`;
    }
    if (userReminders.length > 0) {
      response += `User Reminders: ${JSON.stringify(userReminders)}`;
    }
    if (userTickets.length > 0) {
      response += `User Tickets: ${JSON.stringify(userTickets)}`;
    }
  }

  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
