import {
  TextChannel,
  Colors,
} from 'discord.js';
import {
  // ChannelType,
  AuditLogEvent,
} from 'discord-api-types/v10';
import { parse } from 'path';
import {
  MessageDeleteEvent,
} from '../@types/eventDef';
import { embedTemplate } from '../utils/embedTemplate';
import env from '../../global/utils/env.config';
import log from '../../global/utils/log'; // eslint-disable-line @typescript-eslint/no-unused-vars
// import * as path from 'path';
const PREFIX = parse(__filename).name; // eslint-disable-line @typescript-eslint/no-unused-vars

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export default messageDelete;

export const messageDelete: MessageDeleteEvent = {
  name: 'messageDelete',
  async execute(message) {
    // Only run on Tripsit or DM, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (!message.guild) return;
    if (message.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    // log.debug(`[${PREFIX}] message: ${JSON.stringify(message, null, 2)}`);

    const fetchedLogs = await message.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MessageDelete,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const deletionLog = fetchedLogs.entries.first();

    // Perform a coherence check to make sure that there's *something*
    if (!deletionLog) {
      const botlog = message.client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
      botlog.send(`A message by ${message.author.tag} was deleted, but no relevant audit logs were found.`);
      return;
    }

    // Now grab the user object of the person who deleted the message
    // Also grab the target of this action to double-check things
    const { executor, target } = deletionLog;

    const intro = `${executor?.id === target.id ? executor.tag : 'Someone'}`;

    const authorName = message.author ? message.author.tag : 'Unknown';
    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter(null)
      .setColor(Colors.Red)
      .setTitle(`${intro} deleted msg in ${(message.channel as TextChannel).name}`)
      .addFields([
        { name: authorName, value: message.content, inline: true },
      ]);
    const botlog = message.client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;

    botlog.send({ embeds: [embed] });
  },
};
