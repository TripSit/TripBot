import {
  Guild,
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  InviteDeleteEvent,
} from '../../@types/eventDef';
// import log from '../../global/utils/log';
// import {parse} from 'path';
const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default inviteDelete;

export const inviteDelete: InviteDeleteEvent = {
  name: 'inviteDelete',
  async execute(invite) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!invite.guild) return;
    if (invite.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `Channel ${invite} was deleted.`);

    const fetchedLogs = await (invite.guild as Guild).fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.InviteDelete,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const deletionLog = fetchedLogs.entries.first();

    const auditlog = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!deletionLog) {
      await auditlog.send(`${invite.url} was deleted, but no relevant audit logs were found.`);
      return;
    }

    const response = deletionLog.executor
      ? `Channel ${invite.url} was deleted by ${deletionLog.executor.tag}.`
      : `Channel ${invite.url} was deleted, but the audit log was inconclusive.`;

    await auditlog.send(response);

    // This is for invite use tracking
    global.guildInvites.get(invite.guild.id).delete(invite.code);
  },
};
