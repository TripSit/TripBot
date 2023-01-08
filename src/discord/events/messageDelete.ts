import {
  TextChannel,
  Colors,
} from 'discord.js';
import {
  // ChannelType,
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  MessageDeleteEvent,
} from '../@types/eventDef';
import { embedTemplate } from '../utils/embedTemplate';
// eslint-disable-line @typescript-eslint/no-unused-vars
const F = f(__filename); // eslint-disable-line @typescript-eslint/no-unused-vars

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default messageDelete;

export const messageDelete: MessageDeleteEvent = {
  name: 'messageDelete',
  async execute(message) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!message.guild) return;
    if (message.guild.id !== env.DISCORD_GUILD_ID) return;
    log.debug(F, `Message in ${message.channel} was deleted.`);

    const msglog = message.client.channels.cache.get(env.CHANNEL_MSGLOG) as TextChannel;

    // log.debug(F, `message: ${JSON.stringify(message, null, 2)}`);

    const fetchedLogs = await message.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MessageDelete,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const deletionLog = fetchedLogs.entries.first();

    // Perform a coherence check to make sure that there's *something*
    if (!deletionLog) {
      await msglog.send(`A message by ${message.author.tag} was deleted, but no relevant audit logs were found.`);
      return;
    }

    // Now grab the user object of the person who deleted the message
    // Also grab the target of this action to double-check things
    const { executor, target } = deletionLog;

    const intro = executor?.id === target.id ? executor.tag : 'Someone';
    const authorName = message.author ? message.author.tag : 'Unknown';
    const content = message.content ? message.content : 'No content';
    const channel = message.channel ? (message.channel as TextChannel).name : 'Unknown';
    // log.debug(F, `${intro} deleted a message by ${authorName} in #${channel}: ${content}`);
    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter(null)
      .setColor(Colors.Red)
      .setTitle(`${intro} deleted msg in ${channel}`);

    try {
      embed.addFields([
        { name: authorName, value: content.slice(0, 1023), inline: true },
      ]);
    } catch (e) {
      log.error(F, `Error adding fields to embed: ${e}`);
      log.error(F, `${authorName}, ${content}`);
    }

    await msglog.send({ embeds: [embed] });
  },
};
