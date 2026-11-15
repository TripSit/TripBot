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
} from '../../@types/eventDef';
import { checkChannelPermissions } from '../../utils/checkPermissions';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const channelDelete: ChannelDeleteEvent = {
  name: 'channelDelete',
  async execute(channel) {
    // Don't run on DMs
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
  },
};

export default channelDelete;
