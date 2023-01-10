import {
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import { WebhookUpdateEvent } from '../@types/eventDef';
// import log from '../../global/utils/log';
// import {parse} from 'path';
const F = f(__filename);

export default webhookUpdate;

export const webhookUpdate: WebhookUpdateEvent = {
  name: 'webhookUpdate',
  async execute(channel) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (channel.guild.id !== env.DISCORD_GUILD_ID) return;
    log.debug(F, `Webhook ${channel.name} was updated`);

    const fetchedLogs = await channel.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.WebhookUpdate || AuditLogEvent.WebhookCreate || AuditLogEvent.WebhookDelete,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

    const auditlog = await client.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!auditLog) {
      await auditlog.send(`Webhook ${channel.name} was updated, but no relevant audit logs were found.`);
      return;
    }

    let response = '' as string;
    const changes = auditLog.changes.map(change => `**[${change.key}]** '**${change.old}**' > '**${change.new}**'`);

    if (auditLog.executor) {
      response = `Webhook **${channel.toString()}** was updated by ${auditLog.executor.tag}:`;
      response += `\n${changes.join('\n')}`; // eslint-disable-line max-len
    } else {
      response = `Webhook ${channel.toString()} was updated, but the audit log was inconclusive.`;
      response += `\n${changes.join('\n')}`; // eslint-disable-line max-len
    }

    await auditlog.send(response);
  },
};
