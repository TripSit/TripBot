import {
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  ThreadUpdateEvent,
} from '../@types/eventDef';
import { checkChannelPermissions, checkGuildPermissions } from '../utils/checkPermissions';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const threadUpdate: ThreadUpdateEvent = {
  name: 'threadUpdate',
  async execute(oldThread, newThread) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!newThread.guild) return;
    if (newThread.guild.id !== env.DISCORD_GUILD_ID) return;
    // log.info(F, `Thread ${newThread.name} was updated.`);

    const perms = await checkGuildPermissions(newThread.guild, [
      'ViewAuditLog' as PermissionResolvable,
    ]);

    if (perms.length > 0) {
      const guildOwner = await newThread.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.join(', ')} in ${newThread.guild} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${perms.join(', ')} in ${newThread.guild}!`);
      return;
    }

    const fetchedLogs = await newThread.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ThreadUpdate,
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
      await channel.send(`Thread ${newThread.name} was updated, but no relevant audit logs were found.`);
      return;
    }

    let response = '' as string;
    const changes = auditLog.changes.map(change => `**[${change.key}]** '**${change.old}**' > '**${change.new}**'`);

    if (auditLog.executor) {
      response = `Thread **${newThread.toString()}** was updated by ${auditLog.executor.tag}:`;
      response += `\n${changes.join('\n')}`; // eslint-disable-line max-len
    } else {
      response = `Thread ${newThread.toString()} was updated, but the audit log was inconclusive.`;
      response += `\n${changes.join('\n')}`; // eslint-disable-line max-len
    }

    await channel.send(response);
  },
};

export default threadUpdate;
