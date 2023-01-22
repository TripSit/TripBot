import {
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  ThreadCreateEvent,
} from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default threadCreate;

export const threadCreate: ThreadCreateEvent = {
  name: 'threadCreate',
  async execute(thread) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!thread.guild) return;
    if (thread.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `Thread ${thread.name} was created.`);

    const fetchedLogs = await thread.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ThreadCreate,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

    const auditlog = await client.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!auditLog) {
      await auditlog.send(`${thread.name} was created, but no relevant audit logs were found.`);
      return;
    }

    const response = auditLog.executor
      ? `Channel ${thread.name} was created by ${auditLog.executor.tag}.`
      : `Channel ${thread.name} was created, but the audit log was inconclusive.`;

    await auditlog.send(response);
  },
};
