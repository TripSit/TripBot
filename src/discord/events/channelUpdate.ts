import {
  TextChannel,
} from 'discord.js';
import {
  ChannelType,
  AuditLogEvent,
} from 'discord-api-types/v10';

import {
  ChannelUpdateEvent,
} from '../@types/eventDef';
// import log from '../../global/utils/log';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default channelUpdate;

export const channelUpdate: ChannelUpdateEvent = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel) {
    // Dont run on DMs
    if (newChannel.type === ChannelType.DM) return;
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (newChannel.guild.id !== env.DISCORD_GUILD_ID) return;

    if ([
      env.CHANNEL_STATS_TOTAL,
      env.CHANNEL_STATS_ONLINE,
      env.CHANNEL_STATS_MAX,
    ].includes(newChannel.id)) {
      return;
    }

    log.debug(F, `Channel ${newChannel.name} was updated.`);

    const fetchedLogs = await newChannel.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ChannelUpdate,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

    const auditlog = client.channels.cache.get(env.CHANNEL_AUDITLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!auditLog) {
      await auditlog.send(`Channel ${newChannel.name} was updated, but no relevant audit logs were found.`);
      return;
    }

    let response = '' as string;
    const changes = auditLog.changes.map(change => `**[${change.key}]** '**${change.old}**' > '**${change.new}**'`);

    if (auditLog.executor) {
      response = `Channel **${newChannel.toString()}** was updated by ${auditLog.executor.tag}:`;
      response += `\n${changes.join('\n')}`;
    } else {
      response = `Channel ${newChannel.toString()} was updated, but the audit log was inconclusive.`;
      response += `\n${changes.join('\n')}`;
    }

    await auditlog.send(response);
  },
};
