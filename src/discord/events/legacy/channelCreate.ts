import {
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  ChannelCreateEvent,
} from '../../@types/eventDef';
import { checkChannelPermissions, checkGuildPermissions } from '../../utils/checkPermissions';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default channelCreate;

export const channelCreate: ChannelCreateEvent = {
  name: 'channelCreate',
  async execute(channel) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (channel.guild.id !== env.DISCORD_GUILD_ID) return;

    const perms = await checkGuildPermissions(channel.guild, [
      'ViewAuditLog' as PermissionResolvable,
    ]);

    if (!perms.hasPermission) {
      const guildOwner = await channel.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.permission} in ${channel.guild} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${perms.permission} in ${channel.guild}!`);
      return;
    }

    const fetchedLogs = await channel.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ChannelCreate,
    });

    const creationLog = fetchedLogs.entries.first();

    const channelAuditlog = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    const channelPerms = await checkChannelPermissions(channelAuditlog, [
      'ViewChannel' as PermissionResolvable,
      'SendMessages' as PermissionResolvable,
    ]);
    if (!channelPerms.hasPermission) {
      const guildOwner = await channel.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${channelPerms.permission} in ${channelAuditlog} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${channelPerms.permission} in ${channelAuditlog}!`);
      return;
    }

    // Perform a coherence check to make sure that there's *something*
    if (!creationLog) {
      await channelAuditlog.send(`Channel ${channel.name} was created, but no relevant audit logs were found.`);
      return;
    }

    const response = creationLog.executor
      ? `Channel ${channel.name} was created by ${creationLog.executor.tag}.`
      : `Channel ${channel.name} was created, but the audit log was inconclusive.`;

    await channelAuditlog.send(response);
  },
};
