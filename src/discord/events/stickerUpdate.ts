import {
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  StickerUpdateEvent,
} from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default stickerUpdate;

export const stickerUpdate: StickerUpdateEvent = {
  name: 'stickerUpdate',
  async execute(oldSticker, newSticker) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!newSticker.guild) return;
    if (newSticker.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `Sticker ${newSticker.name} was updated.`);

    const fetchedLogs = await newSticker.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.StickerUpdate,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

    const auditlog = await client.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!auditLog) {
      await auditlog.send(`Sticker ${newSticker.name} was updated, but no relevant audit logs were found.`);
      return;
    }

    let response = '' as string;
    const changes = auditLog.changes.map(change => `**[${change.key}]** '**${change.old}**' > '**${change.new}**'`);

    if (auditLog.executor) {
      response = `Sticker **${newSticker.toString()}** was updated by ${auditLog.executor.tag}:`;
      response += `\n${changes.join('\n')}`; // eslint-disable-line max-len
    } else {
      response = `Sticker ${newSticker.toString()} was updated, but the audit log was inconclusive.`;
      response += `\n${changes.join('\n')}`; // eslint-disable-line max-len
    }

    await auditlog.send(response);
  },
};
