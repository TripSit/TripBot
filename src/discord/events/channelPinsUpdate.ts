import {
  TextBasedChannel,
  TextChannel,
} from 'discord.js';
import {
  ChannelType,
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  ChannelPinsUpdateEvent,
} from '../@types/eventDef';
// const F= f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default channelPinsUpdate;

export const channelPinsUpdate: ChannelPinsUpdateEvent = {
  name: 'channelPinsUpdate',
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
      type: AuditLogEvent.MessagePin,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const pinLog = fetchedLogs.entries.first();

    const auditlog = client.channels.cache.get(env.CHANNEL_AUDITLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!pinLog) {
      await auditlog.send(`Channel ${channel.name} pinned a message, but no relevant audit logs were found.`);
      return;
    }

    let response = '' as string;

    if (pinLog.executor) {
      response = `Channel ${pinLog.executor.tag} pinned a message in ${channel.name}:`;
      // Get the message that was pinned
      if ((channel as TextBasedChannel).messages === undefined) {
        const message = await (channel as TextBasedChannel).messages.fetch(pinLog.extra.messageId);
        response += `
          > ${message.content}
        `;
      }
    } else {
      response = `Channel ${channel.name} had a message pinned, but the audit log was inconclusive.`;
    }

    await auditlog.send(response);
  },
};
