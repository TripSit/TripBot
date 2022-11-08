import {
  TextChannel,
} from 'discord.js';
import {
  // ChannelType,
  AuditLogEvent, ChannelType,
} from 'discord-api-types/v10';
import {
  channelDeleteEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
// import logger from '../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const channelDelete: channelDeleteEvent = {
  name: 'channelDelete',
  async execute(channel) {
    // Dont run on DMs
    if (channel.type === ChannelType.DM) {
      return;
    }

    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (channel.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    const fetchedLogs = await channel.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ChannelDelete,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const deletionLog = fetchedLogs.entries.first();

    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!deletionLog) {
      botlog.send(`Channel ${channel.name} was created, but no relevant audit logs were found.`);
      return;
    }

    let response = '' as string;

    if (deletionLog.executor) {
      response = `Channel ${channel.name} was deleted by ${deletionLog.executor.tag}.`;
    } else {
      response = `Channel ${channel.name} was deleted, but the audit log was inconclusive.`;
    }

    botlog.send(response);
  },
};
