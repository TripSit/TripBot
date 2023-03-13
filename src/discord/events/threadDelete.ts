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
} from '../../global/@types/database';

const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default threadDelete;

export const threadDelete: ThreadDeleteEvent = {
  name: 'threadDelete',
  async execute(thread) {
    // Make this close tripsit threads
  },
};
