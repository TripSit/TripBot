import {
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  StickerCreateEvent,
} from '../../@types/eventDef';
import { checkChannelPermissions, checkGuildPermissions } from '../../utils/checkPermissions';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default stickerCreate;

export const stickerCreate: StickerCreateEvent = {
  name: 'stickerCreate',
  async execute(sticker) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!sticker.guild) return;
    if (sticker.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `Sticker ${sticker.name} was created.`);

    const perms = await checkGuildPermissions(sticker.guild, [
      'ViewAuditLog' as PermissionResolvable,
    ]);

    if (!perms.hasPermission) {
      const guildOwner = await sticker.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.permission} in ${sticker.guild} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${perms.permission} in ${sticker.guild}!`);
      return;
    }

    const fetchedLogs = await sticker.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.StickerCreate,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

    const channel = await client.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;
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
      await channel.send(`${sticker.name} was created, but no relevant audit logs were found.`);
      return;
    }

    const response = auditLog.executor
      ? `Channel ${sticker.name} was created by ${auditLog.executor.tag}.`
      : `Channel ${sticker.name} was created, but the audit log was inconclusive.`;

    await channel.send(response);
  },
};
