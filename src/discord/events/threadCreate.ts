import postAuditLog from '@discord/utils/auditLog';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  ThreadCreateEvent,
} from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const threadCreate: ThreadCreateEvent = {
  name: 'threadCreate',
  async execute(thread) {
    await postAuditLog({
      guild: thread.guild,
      type: AuditLogEvent.ThreadCreate,
      subject: `Thread **${thread.toString()}**`,
      action: 'created',
      caller: F,
    });
  },
};

export default threadCreate;
