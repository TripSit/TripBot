import { PrismaClient } from '@prisma/client';
import {
  ThreadDeleteEvent,
} from '../@types/eventDef';

const db = new PrismaClient({ log: ['error', 'info', 'query', 'warn'] });

const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const threadDelete: ThreadDeleteEvent = {
  name: 'threadDelete',
  async execute(thread) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!thread.guild) return;
    if (thread.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `Thread ${thread.name} was deleted.`);

    // Find if the channel is used as a thread_id in any tickets
    const ticketData = await db.user_tickets.findFirst({
      where: {
        thread_id: thread.id,
        status: {
          not: {
            in: ['CLOSED', 'RESOLVED', 'DELETED'],
          },
        },
      },
    });

    if (ticketData) {
      await db.user_tickets.update({
        where: {
          id: ticketData.id,
        },
        data: {
          status: 'DELETED',
        },
      });
    }
  },
};

export default threadDelete;
