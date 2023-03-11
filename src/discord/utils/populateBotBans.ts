/* eslint-disable no-unused-vars */

import { Users } from '../../global/@types/database';
import { db } from '../../global/utils/knex';

export default populateBans;

const F = f(__filename); // eslint-disable-line

// Create a dictionary that will be used for future checks that contains the status of every user
export const botBannedUsers: string[] = [];

export async function populateBans():Promise<void> {
  // On bot startup, query the db and populate botBannedUsers with all users who are banned
  const bannedUsers = await db<Users>('users')
    .select(db.ref('discord_id').as('discord_id'))
    .where('discord_bot_ban', true);
  bannedUsers.forEach(user => {
    if (user.discord_id) {
      log.debug(F, `user: ${user.discord_id} is banned`);
      botBannedUsers.push(user.discord_id);
    }
  });
}
