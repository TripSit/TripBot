import postAuditLog from '@discord/utils/auditLog';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  ThreadUpdateEvent,
} from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const threadUpdate: ThreadUpdateEvent = {
  name: 'threadUpdate',
  async execute(oldThread, newThread) {
    if (!newThread.guild) return;
    await postAuditLog({
      guild: newThread.guild,
      type: AuditLogEvent.ThreadUpdate,
      subject: `Thread **${newThread.toString()}**`,
      action: 'updated',
      showChanges: true,
      caller: F,
    });
  },
};

export default threadUpdate;
