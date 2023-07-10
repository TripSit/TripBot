// import {
//   TextChannel,
// } from 'discord.js';
// import {
//   AuditLogEvent,
// } from 'discord-api-types/v10';
import {
  RoleUpdateEvent,
} from '../../@types/eventDef';
// import env from '../../global/utils/env.config';
// const F= f(__filename);

// https://discordjs.guide/popular-topics/audit-logs.html#who-deleted-a-message

export const roleUpdate: RoleUpdateEvent = {
  name: 'roleUpdate',
  async execute(/** oldRole, newRole* */) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    // if (newRole.guild.id !== env.DISCORD_GUILD_ID) {
    //   return;
    // }

    // This is super bad, need to rework

    // const perms = await checkGuildPermissions(sticker.guild, [
    //   'ViewAuditLog' as PermissionResolvable,
    // ]);

    // if (!perms.hasPermission) {
    //   const guildOwner = await sticker.guild.fetchOwner();
    //   await guildOwner.send({
    //   content: `Please make sure I can ${perms.permission} in ${sticker.guild} so I can run ${F}!`,
    // });
    //   log.error(F, `Missing permission ${perms.permission} in ${sticker.guild}!`);
    //   return;
    // }

    // const fetchedLogs = await newRole.guild.fetchAuditLogs({
    //   limit: 1,
    //   type: AuditLogEvent.RoleUpdate,
    // });

    // // Since there's only 1 audit log entry in this collection, grab the first one
    // const auditLog = fetchedLogs.entries.first();

    // const channel = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;
    // const channelPerms = await checkChannelPermissions(channel, [
    //   'ViewChannel' as PermissionResolvable,
    //   'SendMessages' as PermissionResolvable,
    // ]);
    // if (!channelPerms.hasPermission) {
    //   const guildOwner = await channel.guild.fetchOwner();
    //   await guildOwner.send({
    //   content: `Please make sure I can ${channelPerms.permission} in ${channel} so I can run ${F}!`,
    // });
    //   log.error(F, `Missing permission ${channelPerms.permission} in ${channel}!`);
    //   return;
    // }

    // // Perform a coherence check to make sure that there's *something*
    // if (!auditLog) {
    //   await channel.send(`Role ${newRole.name} was updated, but no relevant audit logs were found.`);
    //   return;
    // }

    // let response = '' as string;
    // const changes = auditLog.changes.map(change => `**[${change.key}]** '**${change.old}**' > '**${change.new}**'`);
    // if (auditLog.executor) {
    //   response = `Role **${newRole.toString()}** was updated by ${auditLog.executor.tag}:`;
    //   response += `\n${changes.join('\n')}`; // eslint-disable-line max-len
    // } else {
    //   response = `Role ${newRole.toString()} was updated, but the audit log was inconclusive.`;
    //   response += `\n${changes.join('\n')}`; // eslint-disable-line max-len
    // }

    // await channel.send(response);
  },
};

export default roleUpdate;
