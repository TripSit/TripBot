import {
  TextChannel,
} from 'discord.js';
import {
  ChannelType,
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  channelUpdateEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
import log from '../../global/utils/log'; // eslint-disable-line no-unused-vars
import * as path from 'path'; // eslint-disable-line no-unused-vars
const PREFIX = path.parse(__filename).name; // eslint-disable-line no-unused-vars

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const channelUpdate: channelUpdateEvent = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel) {
    // Dont run on DMs
    if (newChannel.type === ChannelType.DM) {
      return;
    }

    if (oldChannel.type === ChannelType.DM) {
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

    if (auditLog.executor) {
      response = `Channel **${newChannel.toString()}** was updated by ${auditLog.executor.tag}:`;
      response += `\n${auditLog.changes.map(change => `**[${change.key}]** '**${change.old}**' > '**${change.new}**'`).join('\n')}`; // eslint-disable-line max-len
    } else {
      response = `Channel ${newChannel.toString()} was updated, but the audit log was inconclusive.`;
      response += `\n${auditLog.changes.map(change => `**[${change.key}]** '**${change.old}**' > '**${change.new}**'`).join('\n')}`; // eslint-disable-line max-len
    }

    botlog.send(response);
  },
};
