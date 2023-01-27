import {
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  ThreadDeleteEvent,
} from '../@types/eventDef';
import { getOpenTicket, ticketUpdate } from '../../global/utils/knex';
import {
  TicketStatus,
} from '../../global/@types/pgdb';

const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default threadDelete;

export const threadDelete: ThreadDeleteEvent = {
  name: 'threadDelete',
  async execute(thread) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!thread.guild) return;
    if (thread.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `Thread ${thread.name} was deleted.`);

    // log.debug(F, `threadDelete: ${thread.name} (${thread.id})`);
    const tripsit = await client.guilds.fetch(env.DISCORD_GUILD_ID);

    const fetchedLogs = await tripsit.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ThreadDelete,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

    const auditlog = await client.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    // Find if the channel is used as a thread_id in any tickets
    const ticketData = await getOpenTicket(null, thread.id);

    if (ticketData) {
      // log.debug(F, `closing ticket: ${JSON.stringify(ticketData, null, 2)}`);
      // If it is, close the ticket

      ticketData.status = 'DELETED' as TicketStatus;
      await ticketUpdate(ticketData);
    }

    // Perform a coherence check to make sure that there's *something*
    if (!auditLog) {
      await auditlog.send(`${thread.name} was deleted, but no relevant audit logs were found.`);
      return;
    }

    const response = auditLog.executor
      ? `Channel ${thread.name} was deleted by ${auditLog.executor.tag}.`
      : `Channel ${thread.name} was deleted, but the audit log was inconclusive.`;

    await auditlog.send(response);
  },
};
