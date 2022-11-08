import {
  TextChannel,
} from 'discord.js';
import {
  AuditLogEvent,
} from 'discord-api-types/v10';
import {
  guildBanAddEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
// import logger from '../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const guildBanAdd: guildBanAddEvent = {
  name: 'guildBanAdd',
  async execute(ban) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (ban.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    const fetchedLogs = await ban.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanAdd,
    });

    // Since there's only 1 audit log entry in this collection, grab the first one
    const creationLog = fetchedLogs.entries.first();

    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;

    // Perform a coherence check to make sure that there's *something*
    if (!creationLog) {
      botlog.send(`${ban.user} was banned, but no relevant audit logs were found.`);
      return;
    }

    let response = '' as string;

    if (creationLog.executor) {
      response = `${ban.user} was banned by ${creationLog.executor.tag}.`;
    } else {
      response = `${ban.user} was banned, but the audit log was inconclusive.`;
    }

    botlog.send(response);
  },
};
