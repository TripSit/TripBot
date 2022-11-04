/* eslint-disable no-unused-vars */
import {
  DMChannel,
  GuildChannel,
  ChannelType,
} from 'discord.js';
import {
  threadEvent,
} from '../@types/eventDef';
import {db} from '../../global/utils/knex';
import {DiscordGuilds, TicketStatus, UserTickets} from '../../global/@types/pgdb';
import log from '../../global/utils/log';
import {stripIndents} from 'common-tags';
const PREFIX = require('path').parse(__filename).name;

export const channelDelete: threadEvent = {
  name: 'threadDelete',
  async execute(thread) {
    log.debug(stripIndents`[${PREFIX}] ${thread.name}`);

    // Find if the channel is used as a thread_id in any tickets
    const ticket = await db
      .select(
        db.ref('id'))
      .from<UserTickets>('user_tickets')
      .where('thread_id', thread.id)
      .andWhere('status', 'OPEN')
      .first();

    if (ticket) {
      log.debug(`[${PREFIX}] closing ticket: ${JSON.stringify(ticket, null, 2)}`);
      // If it is, close the ticket
      await db<UserTickets>('user_tickets')
        .update({
          status: 'CLOSED' as TicketStatus,
        })
        .where('id', ticket.id);
    }

    // log.debug(`[${PREFIX}] finished!`);
  },
};
