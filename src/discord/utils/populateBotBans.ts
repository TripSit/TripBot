/* eslint-disable no-unused-vars */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({ log: ['error'] });

export default populateBans;

const F = f(__filename); // eslint-disable-line

// Create a dictionary that will be used for future checks that contains the status of every user
export const botBannedUsers: string[] = [];

export async function populateBans():Promise<void> {
  const bannedUsers = await db.users.findMany({
    select: {
      discord_id: true,
    },
    where: {
      discord_bot_ban: true,
    },
  });

  bannedUsers.forEach(user => {
    if (user.discord_id) {
      // log.debug(F, `user: ${user.discord_id} is banned`);
      botBannedUsers.push(user.discord_id);
    }
  });
}
