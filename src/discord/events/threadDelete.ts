import postAuditLog from '@discord/utils/auditLog';
import { AuditLogEvent } from 'discord.js';
import {
  ThreadDeleteEvent,
} from '../@types/eventDef';

const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const threadDelete: ThreadDeleteEvent = {
  name: 'threadDelete',
  async execute(thread) {
    if (!thread.guild) return;
    await postAuditLog({
      guild: thread.guild,
      type: AuditLogEvent.ThreadDelete,
      subject: `Thread **${thread.toString}**`,
      action: 'deleted',
      caller: F,
    });
  },
};

export default threadDelete;
