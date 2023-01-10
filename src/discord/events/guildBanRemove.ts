import {
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  GuildBanRemoveEvent,
} from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default guildBanRemove;

export const guildBanRemove: GuildBanRemoveEvent = {
  name: 'guildBanRemove',
  async execute(ban) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (ban.guild.id !== env.DISCORD_GUILD_ID) return;
    log.debug(F, `Channel ${ban.user} was remove.`);

    const fetchedLogs = await ban.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanRemove,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const creationLog = fetchedLogs.entries.first();

    const auditlog = await client.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!creationLog) {
      await auditlog.send(`${ban.user} was unbaned, but no relevant audit logs were found.`);
      return;
    }

    const response = creationLog.executor
      ? `Channel ${ban.user} was unbanned by ${creationLog.executor.tag}.`
      : `Channel ${ban.user} was unbanned, but the audit log was inconclusive.`;

    await auditlog.send(response);
  },
};
