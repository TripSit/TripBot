import {
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  stickerUpdateEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
// import logger from '../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const stickerUpdate: stickerUpdateEvent = {
  name: 'stickerUpdate',
  async execute(oldSticker, newSticker) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!newSticker.guild) return;
    if (newSticker.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    const fetchedLogs = await newSticker.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.StickerUpdate,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const auditLog = fetchedLogs.entries.first();

    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!auditLog) {
      botlog.send(`Sticker ${newSticker.name} was updated, but no relevant audit logs were found.`);
      return;
    }

    let response = '' as string;

    if (auditLog.executor) {
      response = `Sticker **${newSticker.toString()}** was updated by ${auditLog.executor.tag}:`;
      response += `\n${auditLog.changes.map(change => `**[${change.key}]** '**${change.old}**' > '**${change.new}**'`).join('\n')}`; // eslint-disable-line max-len
    } else {
      response = `Sticker ${newSticker.toString()} was updated, but the audit log was inconclusive.`;
      response += `\n${auditLog.changes.map(change => `**[${change.key}]** '**${change.old}**' > '**${change.new}**'`).join('\n')}`; // eslint-disable-line max-len
    }

    botlog.send(response);
  },
};
