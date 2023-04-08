import {
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  EmojiUpdateEvent,
} from '../@types/eventDef';
import { checkChannelPermissions, checkGuildPermissions } from '../utils/checkPermissions';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default emojiUpdate;

export const emojiUpdate: EmojiUpdateEvent = {
  name: 'emojiUpdate',
  async execute(oldEmoji, newEmoji) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (newEmoji.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `Emoji ${newEmoji.name} was updated.`);

    const perms = await checkGuildPermissions(newEmoji.guild, [
      'ViewAuditLog' as PermissionResolvable,
    ]);

    if (!perms.hasPermission) {
      const guildOwner = await newEmoji.guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.permission} in ${newEmoji.guild} so I can run ${F}!` }); // eslint-disable-line
      log.error(F, `Missing permission ${perms.permission} in ${newEmoji.guild}!`);
      return;
    }

    const fetchedLogs = await newEmoji.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.EmojiUpdate,
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
      await channel.send(`Emoji ${newEmoji.name} was updated, but no relevant audit logs were found.`);
      return;
    }

    let response = '' as string;

    const changes = auditLog.changes.map(change => `**[${change.key}]** '**${change.old}**' > '**${change.new}**'`);

    if (auditLog.executor) {
      response = `Emoji **${newEmoji.toString()}** was updated by ${auditLog.executor.tag}:`;
      response += `\n${changes.join('\n')}`; // eslint-disable-line max-len
    } else {
      response = `Emoji ${newEmoji.toString()} was updated, but the audit log was inconclusive.`;
      response += `\n${changes.join('\n')}`; // eslint-disable-line max-len
    }

    await channel.send(response);
  },
};
