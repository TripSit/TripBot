import postAuditLog from '@discord/utils/auditLog';
import { AuditLogEvent } from 'discord.js';
import {
  ThreadDeleteEvent,
} from '../@types/eventDef';

const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const threadDelete: ThreadDeleteEvent = {
  name: 'threadDelete',
  async execute(thread) {
    if (!thread.guild) return;
    await postAuditLog({
      guild: thread.guild,
      type: AuditLogEvent.ThreadDelete,
      subject: `Thread **${thread.toString()}**`,
      action: 'deleted',
      caller: F,
    });

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
