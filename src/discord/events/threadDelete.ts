/* eslint-disable no-unused-vars */
import {
  DMChannel,
  GuildChannel,
  ChannelType,
} from 'discord.js';
import {
  threadEvent,
} from '../@types/eventDef';
import {db, getOpenTicket} from '../../global/utils/knex';
import {DiscordGuilds, TicketStatus, UserTickets} from '../../global/@types/pgdb';
import log from '../../global/utils/log';
import {stripIndents} from 'common-tags';
const PREFIX = require('path').parse(__filename).name;

export const channelDelete: threadEvent = {
  name: 'threadDelete',
  async execute(thread) {
    log.debug(stripIndents`[${PREFIX}] ${thread.name}`);

    // Find if the channel is used as a thread_id in any tickets
    const ticketData = await getOpenTicket(null, thread.id);

    if (ticketData) {
      log.debug(`[${PREFIX}] closing ticket: ${JSON.stringify(ticketData, null, 2)}`);
      // If it is, close the ticket
      await db<UserTickets>('user_tickets')
        .update({
          status: 'CLOSED' as TicketStatus,
        })
        .where('id', ticketData.id);
    }

    // log.debug(`[${PREFIX}] finished!`);
  },
};
