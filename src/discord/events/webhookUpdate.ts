import type { PermissionResolvable, TextChannel } from 'discord.js';

import { AuditLogEvent } from 'discord-api-types/v10';

import type { WebhookUpdateEvent } from '../@types/eventDef';

import { checkChannelPermissions, checkGuildPermissions } from '../utils/checkPermissions';
// import log from '../../global/utils/log';
// import {parse} from 'path';
const F = f(__filename);

export const webhookUpdate: WebhookUpdateEvent = {
  async execute(channel) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (channel.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }
    log.info(F, `Webhook ${channel.name} was updated`);

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
      type:
        AuditLogEvent.WebhookUpdate || AuditLogEvent.WebhookCreate || AuditLogEvent.WebhookDelete,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

    const channelAuditlog = (await discordClient.channels.fetch(
      env.CHANNEL_AUDITLOG,
    )) as TextChannel;
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
    if (!auditLog) {
      await channelAuditlog.send(
        `Webhook ${channel.name} was updated, but no relevant audit logs were found.`,
      );
      return;
    }

    let response = '' as string;
    const changes = auditLog.changes.map(
      (change) => `**[${change.key}]** '**${change.old}**' > '**${change.new}**'`,
    );

    if (auditLog.executor) {
      response = `Webhook **${channel.toString()}** was updated by ${auditLog.executor.tag}:`;
      response += `\n${changes.join('\n')}`;
    } else {
      response = `Webhook ${channel.toString()} was updated, but the audit log was inconclusive.`;
      response += `\n${changes.join('\n')}`;
    }

    await channelAuditlog.send(response);
  },
  name: 'webhookUpdate',
};

export default webhookUpdate;
