import {
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  ThreadCreateEvent,
} from '../../@types/eventDef';
import { checkChannelPermissions, checkGuildPermissions } from '../../utils/checkPermissions';

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

    const perms = await checkGuildPermissions(thread.guild, [
      'ViewAuditLog' as PermissionResolvable,
    ]);

    if (perms.length > 0) {
      const guildOwner = await thread.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.join(', ')} in ${thread.guild} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${perms.join(', ')} in ${thread.guild}!`);
      return;
    }

    const fetchedLogs = await thread.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ThreadCreate,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

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
    if (!auditLog) {
      await channel.send(`${thread.name} was created, but no relevant audit logs were found.`);
      return;
    }

    const response = auditLog.executor
      ? `Channel ${thread.name} was created by ${auditLog.executor.tag}.`
      : `Channel ${thread.name} was created, but the audit log was inconclusive.`;

    await channel.send(response);
  },
};
