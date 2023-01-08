import {
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  GuildBanAddEvent,
} from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default guildBanAdd;

export const guildBanAdd: GuildBanAddEvent = {
  name: 'guildBanAdd',
  async execute(ban) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (ban.guild.id !== env.DISCORD_GUILD_ID) return;
    log.debug(F, `Channel ${ban.user} was added.`);

    const fetchedLogs = await ban.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanAdd,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const creationLog = fetchedLogs.entries.first();

    const auditlog = client.channels.cache.get(env.CHANNEL_AUDITLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!creationLog) {
      await auditlog.send(`${ban.user} was banned, but no relevant audit logs were found.`);
      return;
    }

    const response = creationLog.executor
      ? `Channel ${ban.user} was banned by ${creationLog.executor.tag}.`
      : `Channel ${ban.user} was banned, but the audit log was inconclusive.`;

    await auditlog.send(response);
  },
};
