import {
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  StickerCreateEvent,
} from '../@types/eventDef';
// const F= f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default stickerCreate;

export const stickerCreate: StickerCreateEvent = {
  name: 'stickerCreate',
  async execute(sticker) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!sticker.guild) return;
    if (sticker.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    const fetchedLogs = await sticker.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.StickerCreate,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

    const auditlog = client.channels.cache.get(env.CHANNEL_AUDITLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!auditLog) {
      await auditlog.send(`${sticker.name} was created, but no relevant audit logs were found.`);
      return;
    }

    const response = auditLog.executor
      ? `Channel ${sticker.name} was created by ${auditLog.executor.tag}.`
      : `Channel ${sticker.name} was created, but the audit log was inconclusive.`;

    await auditlog.send(response);
  },
};
