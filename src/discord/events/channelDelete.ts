import {
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import {
  // AuditLogEvent,
  ChannelType,
} from 'discord-api-types/v10';
import {
  ChannelDeleteEvent,
} from '../@types/eventDef';
import { checkChannelPermissions } from '../utils/checkPermissions';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const channelDelete: ChannelDeleteEvent = {
  name: 'channelDelete',
  async execute(channel) {
    // Dont run on DMs
    if (channel.type === ChannelType.DM) return;
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (channel.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `Channel ${channel.name} was deleted.`);

    const channelAuditlog = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    const channelPerms = await checkChannelPermissions(channelAuditlog, [
      'ViewChannel' as PermissionResolvable,
      'SendMessages' as PermissionResolvable,
    ]);
    if (!channelPerms.hasPermission) {
      const guildOwner = await channel.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${channelPerms.permission} in ${channelAuditlog} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${channelPerms.permission} in ${channelAuditlog}!`);
      return;
    }

    await channelAuditlog.send(`Channel ${channel.name} was deleted.`);

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
    //   await channelAuditlog.send(`Channel ${channel.name} was created, but no relevant audit logs were found.`);
    //   return;
    // }

    // const response = deletionLog.executor
    //   ? `Channel ${channel.name} was deleted by ${deletionLog.executor.tag}.`
    //   : `Channel ${channel.name} was deleted, but the audit log was inconclusive.`;

    // await channelAuditlog.send(response);
  },
};

export default channelDelete;
