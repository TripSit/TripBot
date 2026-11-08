import postAuditLog from '@discord/utils/auditLog';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import { WebhookUpdateEvent } from '../@types/eventDef';

const F = f(__filename);

export const webhookUpdate: WebhookUpdateEvent = {
  name: 'webhookUpdate',
  async execute(channel) {
    await postAuditLog({
      guild: channel.guild,
      type: AuditLogEvent.WebhookUpdate,
      subject: `Webhook **${channel.toString()}**`,
      action: 'updated',
      showChanges: true,
      caller: F,
    });
  },
};

export default webhookUpdate;
