import {
  TextChannel,
} from 'discord.js';
import {
  // AuditLogEvent,
  ChannelType,
} from 'discord-api-types/v10';
import {
  ChannelDeleteEvent,
} from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default channelDelete;

export const channelDelete: ChannelDeleteEvent = {
  name: 'channelDelete',
  async execute(channel) {
    // Dont run on DMs
    if (channel.type === ChannelType.DM) return;
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (channel.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `Channel ${channel.name} was deleted.`);

    const auditlog = await client.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    await auditlog.send(`Channel ${channel.name} was deleted.`);

    // const fetchedLogs = await channel.guild.fetchAuditLogs({
    //   limit: 1,
    //   type: AuditLogEvent.ChannelDelete,
    // });

    // log.debug(F, `Fetched ${fetchedLogs.entries.size} audit logs.`);

    // // Since there's only 1 audit log entry in this collection, grab the first one
    // const deletionLog = fetchedLogs.entries.first();

    // log.debug(F, `Fetched ${fetchedLogs.entries.size} audit logs.`);

    // // Perform a coherence check to make sure that there's *something*
    // if (!deletionLog) {
    //   await auditlog.send(`Channel ${channel.name} was created, but no relevant audit logs were found.`);
    //   return;
    // }

    // const response = deletionLog.executor
    //   ? `Channel ${channel.name} was deleted by ${deletionLog.executor.tag}.`
    //   : `Channel ${channel.name} was deleted, but the audit log was inconclusive.`;

    // await auditlog.send(response);
  },
};
