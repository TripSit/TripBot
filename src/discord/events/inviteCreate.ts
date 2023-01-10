import {
  Guild,
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  InviteCreateEvent,
} from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default inviteCreate;

export const inviteCreate: InviteCreateEvent = {
  name: 'inviteCreate',
  async execute(invite) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!invite.guild) return;
    if (invite.guild.id !== env.DISCORD_GUILD_ID) return;
    log.debug(F, `Channel ${invite} was created.`);

    const fetchedLogs = await (invite.guild as Guild).fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.InviteCreate,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const creationLog = fetchedLogs.entries.first();

    const auditlog = await client.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!creationLog) {
      await auditlog.send(`${invite.url} was created, but no relevant audit logs were found.`);
      return;
    }

    let response = '';

    if (creationLog.executor) {
      response = `${invite.url} was created by ${creationLog.executor.tag}:`;
    } else {
      response = `${invite.url} was created, but the audit log was inconclusive.`;
    }

    await auditlog.send(response);

    // This is for invite use tracking
    global.guildInvites.get(invite.guild.id).set(invite.code, invite.uses);
  },
};
