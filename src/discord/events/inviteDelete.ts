import {
  Guild,
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  InviteDeleteEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
// import log from '../../global/utils/log';
// import {parse} from 'path';
// const PREFIX = parse(__filename).name;

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default inviteDelete;

export const inviteDelete: InviteDeleteEvent = {
  name: 'inviteDelete',
  async execute(invite) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!invite.guild) return;
    if (invite.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    const fetchedLogs = await (invite.guild as Guild).fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.InviteDelete,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const deletionLog = fetchedLogs.entries.first();

    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!deletionLog) {
      botlog.send(`${invite.url} was deleted, but no relevant audit logs were found.`);
      return;
    }

    let response = '' as string;

    if (deletionLog.executor) {
      response = `${invite.url} was deleted by ${deletionLog.executor.tag}:`;
    } else {
      response = `${invite.url} was deleted, but the audit log was inconclusive.`;
    }

    botlog.send(response);

    // This is for invite use tracking
    global.guildInvites.get(invite.guild.id).delete(invite.code);
  },
};
