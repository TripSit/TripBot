import type { ThreadDeleteEvent } from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const threadDelete: ThreadDeleteEvent = {
  async execute(thread) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!thread.guild) {
      return;
    }
    if (thread.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }
    log.info(F, `Thread ${thread.name} was deleted.`);

    // Find if the channel is used as a thread_id in any tickets
    const ticketData = await db.user_tickets.findFirst({
      where: {
        status: {
          not: {
            in: ['CLOSED', 'RESOLVED', 'DELETED'],
          },
        },
        thread_id: thread.id,
      },
    });

    if (ticketData) {
      await db.user_tickets.update({
        data: {
          status: 'DELETED',
        },
        where: {
          id: ticketData.id,
        },
      });
    }
  },
  name: 'threadDelete',
};

export default threadDelete;
