import {
  TextChannel,
} from 'discord.js';
import {
  ChannelType,
  AuditLogEvent,
} from 'discord-api-types/v10';
// import { parse } from 'path';
import {
  ChannelUpdateEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
// import log from '../../global/utils/log';

// const PREFIX = parse(__filename).name;

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default channelUpdate;

export const channelUpdate: ChannelUpdateEvent = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel) {
    // Dont run on DMs
    if (newChannel.type === ChannelType.DM) {
      return;
    }

    if (oldChannel.type === ChannelType.DM) {
      return;
    }

    if ([
      env.CHANNEL_STATS_TOTAL,
      env.CHANNEL_STATS_ONLINE,
      env.CHANNEL_STATS_MAX,
    ].includes(newChannel.id)) {
      return;
    }

    // log.debug(`[${PREFIX}] Channel ${JSON.stringify(newChannel, null, 2)} was updated.`);
    // logger.debug(`[${PREFIX}] Channel ${JSON.stringify(oldChannel.guild, null, 2)} was updated.`);

    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (newChannel.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    const fetchedLogs = await oldChannel.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ChannelUpdate,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!auditLog) {
      botlog.send(`Channel ${newChannel.name} was updated, but no relevant audit logs were found.`);
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

    botlog.send(response);
  },
};
