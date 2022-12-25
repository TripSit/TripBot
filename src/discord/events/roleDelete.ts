import {
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  RoleDeleteEvent,
} from '../@types/eventDef';
// const F= f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default roleDelete;

export const roleDelete: RoleDeleteEvent = {
  name: 'roleDelete',
  async execute(role) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (role.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    const fetchedLogs = await role.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.RoleDelete,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

    const auditlog = client.channels.cache.get(env.CHANNEL_AUDITLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!auditLog) {
      await auditlog.send(`${role.name} was deleted, but no relevant audit logs were found.`);
      return;
    }

    const response = auditLog.executor
      ? `Channel ${role.name} was deleted by ${auditLog.executor.tag}.`
      : `Channel ${role.name} was deleted, but the audit log was inconclusive.`;

    await auditlog.send(response);
  },
};
