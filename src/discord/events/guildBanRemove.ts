import postAuditLog from '@discord/utils/auditLog';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  GuildBanRemoveEvent,
} from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const guildBanRemove: GuildBanRemoveEvent = {
  name: 'guildBanRemove',
  async execute(ban) {
    await postAuditLog({
      guild: ban.guild,
      type: AuditLogEvent.MemberBanRemove,
      subject: `${ban.user}`,
      action: 'unbanned',
      caller: F,
    });
  },
};

export default guildBanRemove;
