import {
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  GuildBanAddEvent,
} from '../../@types/eventDef';
import { checkChannelPermissions, checkGuildPermissions } from '../../utils/checkPermissions';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default guildBanAdd;

export const guildBanAdd: GuildBanAddEvent = {
  name: 'guildBanAdd',
  async execute(ban) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (ban.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `Channel ${ban.user} was added.`);

    const perms = await checkGuildPermissions(ban.guild, [
      'ViewAuditLog' as PermissionResolvable,
    ]);

    if (perms.length > 0) {
      const guildOwner = await ban.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.join(', ')} in ${ban.guild} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${perms.join(', ')} in ${ban.guild}!`);
      return;
    }

    const fetchedLogs = await ban.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanAdd,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const creationLog = fetchedLogs.entries.first();

    const channel = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;
    const channelPerms = await checkChannelPermissions(channel, [
      'ViewChannel' as PermissionResolvable,
      'SendMessages' as PermissionResolvable,
    ]);
    if (channelPerms.length > 0) {
      const guildOwner = await channel.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${channelPerms.join(', ')} in ${channel} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${channelPerms.join(', ')} in ${channel}!`);
      return;
    }

    // Perform a coherence check to make sure that there's *something*
    if (!creationLog) {
      await channel.send(`${ban.user} was banned, but no relevant audit logs were found.`);
      return;
    }

    const response = creationLog.executor
      ? `Channel ${ban.user} was banned by ${creationLog.executor.tag}.`
      : `Channel ${ban.user} was banned, but the audit log was inconclusive.`;

    await channel.send(response);
  },
};
