import {
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  RoleCreateEvent,
} from '../@types/eventDef';
// const F= f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default roleCreate;

export const roleCreate: RoleCreateEvent = {
  name: 'roleCreate',
  async execute(emoji) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (emoji.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    const fetchedLogs = await emoji.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.RoleCreate,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

    const auditlog = client.channels.cache.get(env.CHANNEL_AUDITLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!auditLog) {
      await auditlog.send(`${emoji.name} was created, but no relevant audit logs were found.`);
      return;
    }

    let response = '' as string;

    if (auditLog.executor) {
      response = `${emoji.name} was created by ${auditLog.executor.tag}.`;
    } else {
      response = `${emoji.name} was created, but the audit log was inconclusive.`;
    }

    await auditlog.send(response);
  },
};
