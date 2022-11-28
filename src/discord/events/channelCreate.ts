import {
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  ChannelCreateEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
// import logger from '../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default channelCreate;

export const channelCreate: ChannelCreateEvent = {
  name: 'channelCreate',
  async execute(channel) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (channel.guild.id !== env.DISCORD_GUILD_ID) return;

    const fetchedLogs = await channel.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ChannelCreate,
    });

    const creationLog = fetchedLogs.entries.first();

    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!creationLog) {
      botlog.send(`Channel ${channel.name} was created, but no relevant audit logs were found.`);
      return;
    }

    let response = '' as string;
    if (creationLog.executor) {
      response = `Channel ${channel.name} was created by ${creationLog.executor.tag}.`;
    } else {
      response = `Channel ${channel.name} was created, but the audit log was inconclusive.`;
    }
    botlog.send(response);
  },
};
