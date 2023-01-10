import {
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  EmojiCreateEvent,
} from '../@types/eventDef';

const F = f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default emojiCreate;

export const emojiCreate: EmojiCreateEvent = {
  name: 'emojiCreate',
  async execute(emoji) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (emoji.guild.id !== env.DISCORD_GUILD_ID) return;
    log.debug(F, `Emoji ${emoji.name} was created.`);

    const fetchedLogs = await emoji.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.EmojiCreate,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const creationLog = fetchedLogs.entries.first();

    const auditlog = await client.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!creationLog) {
      await auditlog.send(`${emoji.name} was created, but no relevant audit logs were found.`);
      return;
    }

    const response = creationLog.executor
      ? `Channel ${emoji.name} was created by ${creationLog.executor.tag}.`
      : `Channel ${emoji.name} was created, but the audit log was inconclusive.`;

    await auditlog.send(response);
  },
};
