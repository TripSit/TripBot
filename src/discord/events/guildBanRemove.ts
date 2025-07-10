import {
  Colors,
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  GuildBanRemoveEvent,
} from '../@types/eventDef';
import { checkChannelPermissions, checkGuildPermissions } from '../utils/checkPermissions';
import embedTemplate from '../utils/embedTemplate';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const guildBanRemove: GuildBanRemoveEvent = {
  name: 'guildBanRemove',
  async execute(ban) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (ban.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `Channel ${ban.user} was remove.`);

    const perms = await checkGuildPermissions(ban.guild, [
      'ViewAuditLog' as PermissionResolvable,
    ]);

    if (!perms.hasPermission) {
      const guildOwner = await ban.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.permission} in ${ban.guild} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${perms.permission} in ${ban.guild}!`);
      return;
    }

    const fetchedLogs = await ban.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanRemove,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const creationLog = fetchedLogs.entries.first();

    const channel = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    const channelPerms = await checkChannelPermissions(channel, [
      'ViewChannel' as PermissionResolvable,
      'SendMessages' as PermissionResolvable,
    ]);
    if (!channelPerms.hasPermission) {
      const guildOwner = await channel.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${channelPerms.permission} in ${channel} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${channelPerms.permission} in ${channel}!`);
      return;
    }

    // Create audit log embed
    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter(null)
      .setTitle('✅ User Unbanned')
      .setColor(Colors.Green)
      .setTimestamp();

    let description = `**${ban.user.tag}** was unbanned`;

    if (creationLog?.executor) {
      if (creationLog.reason?.toLowerCase().includes('ban expired')) {
        description = `**${ban.user.tag}** was unbanned`;
        embed.setFooter({ text: 'Automated action' });
      } else {
        description = `**${creationLog.executor.tag}** unbanned **${ban.user.tag}**`;
        embed.setFooter({
          text: `Action by ${creationLog.executor.tag}`,
          iconURL: creationLog.executor.displayAvatarURL({ size: 32 }),
        });
      }
    }

    if (creationLog?.reason) {
      description += `\n\n**Reason:** ${creationLog.reason}`;
    }

    embed.setDescription(description);
    await channel.send({ embeds: [embed] });
  },
};

export default guildBanRemove;
