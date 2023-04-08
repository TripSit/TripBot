import {
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  EmojiDeleteEvent,
} from '../../@types/eventDef';
import { checkChannelPermissions, checkGuildPermissions } from '../../utils/checkPermissions';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default emojiDelete;

export const emojiDelete: EmojiDeleteEvent = {
  name: 'emojiDelete',
  async execute(emoji) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (emoji.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `Emoji ${emoji.name} was deleted.`);

    const perms = await checkGuildPermissions(emoji.guild, [
      'ViewAuditLog' as PermissionResolvable,
    ]);

    if (!perms.hasPermission) {
      const guildOwner = await emoji.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.permission} in ${emoji.guild} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${perms.permission} in ${emoji.guild}!`);
      return;
    }

    const fetchedLogs = await emoji.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.EmojiDelete,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

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

    // Perform a coherence check to make sure that there's *something*
    if (!auditLog) {
      await channel.send(`${emoji.name} was deleted, but no relevant audit logs were found.`);
      return;
    }

    const response = auditLog.executor
      ? `Channel ${emoji.name} was deleted by ${auditLog.executor.tag}.`
      : `Channel ${emoji.name} was deleted, but the audit log was inconclusive.`;

    await channel.send(response);
  },
};
