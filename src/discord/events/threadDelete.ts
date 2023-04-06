import {
  ThreadDeleteEvent,
} from '../@types/eventDef';
import { getOpenTicket, ticketUpdate } from '../../global/utils/knex';
import {
  TicketStatus,
} from '../../global/@types/database';

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
    const ticketData = await getOpenTicket(null, thread.id);

    if (ticketData) {
      // log.debug(F, `closing ticket: ${JSON.stringify(ticketData, null, 2)}`);
      // If it is, close the ticket

      ticketData.status = 'DELETED' as TicketStatus;
      await ticketUpdate(ticketData);
    }
  },
};

export default threadDelete;
