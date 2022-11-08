import {
  TextChannel,
} from 'discord.js';
import {
  // ChannelType,
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  messageDeleteEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
// import logger from '../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const messageDelete: messageDeleteEvent = {
  name: 'messageDelete',
  async execute(message) {
    // Only run on Tripsit or DM, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (message.guild) {
      if (message.guild.id !== env.DISCORD_GUILD_ID.toString()) {
        return;
      }
    } else {
      return;
    }

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
    const {executor, target} = deletionLog;

    const botlog = message.client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    let response = '' as string;
    // Update the output with a bit more information
    // Also run a check to make sure that the log returned was for the same author's message
    if (message.author) {
      if (target.id === message.author.id) {
        if (executor) {
          response = `${executor.tag} deleted a message by ${message.author.tag} in ${message.channel} saying \n> ${message.content}`; // eslint-disable-line max-len
        } else {
          response = `Someone deleted a message by ${message.author.tag} in ${message.channel} saying \n> ${message.content}`; // eslint-disable-line max-len
        }
      } else {
        response = `Someone deleted a message by ${message.author.tag} in ${message.channel} saying \n> ${message.content}`; // eslint-disable-line max-len
      }
    } else {
      response = `A message with no author was deleted!`;
      return;
    }

    botlog.send(response);
  },
};
