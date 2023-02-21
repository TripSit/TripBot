import {
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
// import { getGuild, guildUpdate } from './knex';

import { embedTemplate } from '../../discord/utils/embedTemplate';
import { checkChannelPermissions } from '../../discord/utils/checkPermissions';

const F = f(__filename);

const newRecordString = '🎈🎉🎊 New Record 🎊🎉🎈';

// Value in milliseconds (1000 * 60 = 1 minute)
// This needs to be 5 minutes for production, cuz discord has rate limits
const interval = env.NODE_ENV === 'production' ? 1000 * 60 * 5 : 1000 * 10;

export default runStats;

async function checkStats() {
  // log.debug(F, 'Checking stats...');
  // Determine how many people are in the tripsit guild
  const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
  if (!tripsitGuild) return;

  const { memberCount } = tripsitGuild;

  // Total member count
  // log.debug(F, `memberCount: ${memberCount}`);
  const channelTotal = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_TOTAL);
  // log.debug(F, `channelTotal: ${channelTotal?.name}`);
  if (channelTotal) {
    const name = `Total: ${memberCount}`;
    if (channelTotal.name !== name) {
      // log.debug(F, `Updating total members to ${memberCount}!`);
      const perms = await checkChannelPermissions(channelTotal, [
        'ViewChannel' as PermissionResolvable,
        'Connect' as PermissionResolvable,
        'ManageChannels' as PermissionResolvable,
      ]);

      if (!perms.hasPermission) {
        log.error(F, `I do not have the '${perms.permission}' permission in ${channelTotal.name}!`);
        return;
      }
      channelTotal.setName(name);
      // log.debug(F, `Updated total members to ${memberCount}!`);
      // Check if the total members is divisible by 100
      if (memberCount % 100 === 0) {
        const embed = embedTemplate()
          .setTitle(newRecordString)
          .setDescription(`We have reached ${memberCount} total members!`);
        const channelLounge = await tripsitGuild.channels.fetch(env.CHANNEL_LOUNGE) as TextChannel;
        if (channelLounge) {
          await channelLounge.send({ embeds: [embed] });
        }
        const channelTeamtripsit = await tripsitGuild.channels.fetch(env.CHANNEL_TEAMTRIPSIT) as TextChannel;
        if (channelTeamtripsit) {
          await channelTeamtripsit.send({ embeds: [embed] });
        }
      }
    }
  } else {
    log.error(F, 'Could not find channel total!');
  }

  // Determine how many people have the Verified role
  await tripsitGuild.members.fetch();
  const roleVerified = await tripsitGuild.roles.fetch(env.ROLE_VERIFIED);
  // log.debug(F, `roleVerified: ${roleVerified?.name} (${roleVerified?.id})`);

  if (roleVerified) {
    const { members } = roleVerified;
    // log.debug(F, `Role verified members: ${members.size}`);
    const channelVerified = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_VERIFIED);
    if (channelVerified) {
      // log.debug(F, `${members.size} / ${memberCount} = ${(members.size / memberCount) * 10000}`);
      const percentVerified = Math.round(((members.size / memberCount) * 10000)) / 100;
      // log.debug(F, `percentVerified: ${percentVerified}%`);
      const name = `Verified: ${members.size} (${percentVerified}%)`;
      // log.debug(F, `channelVerified: ${channelVerified.name}`);
      // log.debug(F, `name: ${name}`);
      if (channelVerified.name !== name) {
        // log.debug(F, `Updating verified members to ${members.size}!`);
        const perms = await checkChannelPermissions(channelVerified, [
          'ViewChannel' as PermissionResolvable,
          'Connect' as PermissionResolvable,
          'ManageChannels' as PermissionResolvable,
        ]);
        if (!perms.hasPermission) {
          log.error(F, `I do not have the '${perms.permission}' permission in ${channelVerified.name}!`);
          return;
        }
        // log.debug(F, `perms: ${JSON.stringify(perms)}`);
        await channelVerified.setName(name);
        // log.debug(F, `Updated verified members to ${members.size}!`);
        if (members.size % 100 === 0) {
          const embed = embedTemplate()
            .setTitle(newRecordString)
            .setDescription(`We have reached ${members.size} verified members!`);
          const channelLounge = await tripsitGuild.channels.fetch(env.CHANNEL_LOUNGE) as TextChannel;
          if (channelLounge) {
            const channelPerms = await checkChannelPermissions(channelLounge, [
              'SendMessages' as PermissionResolvable,
            ]);
            if (!channelPerms.hasPermission) {
              log.error(F, `I do not have the '${channelPerms.permission}' permission in ${channelLounge.name}!`);
              return;
            }
            await channelLounge.send({ embeds: [embed] });
          }
          const channelTeamtripsit = await tripsitGuild.channels.fetch(env.CHANNEL_TEAMTRIPSIT) as TextChannel;
          if (channelTeamtripsit) {
            const channelPerms = await checkChannelPermissions(channelTeamtripsit, [
              'SendMessages' as PermissionResolvable,
            ]);
            if (!channelPerms.hasPermission) {
              log.error(F, `I do not have the '${channelPerms.permission}' permission in ${channelLounge.name}!`);
              return;
            }
            await channelTeamtripsit.send({ embeds: [embed] });
          }
        }
      }
    }
  } else {
    log.error(F, 'Could not find role verified!');
  }

  // Determine the number of users currently online
  // const onlineCount = tripsitGuild.members.cache.filter(
  //   member => member.presence?.status !== undefined && member.presence?.status !== 'offline',
  // ).size;
  // const channelOnline = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_ONLINE);
  // if (channelOnline) {
  //   // log.debug(F, `onlineCount: ${onlineCount}`);
  //   const name = `Online: ${onlineCount}`;
  //   if (channelOnline.name !== name) {
  //     const perms = await checkChannelPermissions(channelOnline, [
  //       'ViewChannel' as PermissionResolvable,
  //       'Connect' as PermissionResolvable,
  //       'ManageChannels' as PermissionResolvable,
  //     ]);
  //     // log.debug(F, `perms: ${JSON.stringify(perms)}`);
  //     if (!perms.hasPermission) {
  //       log.error(F, `I do not have the '${perms.permission}' permission in ${channelOnline.name}!`);
  //       return;
  //     }
  //     // log.debug(F, `Updating online members to ${name}!`);
  //     channelOnline.setName(name);
  //   }
  // }

  // // Update the database's max_online_members if it's higher than the current value
  // // log.debug(F, `Getting guild data`);
  // const guildData = await getGuild(env.DISCORD_GUILD_ID);
  // if (guildData) {
  //   // log.debug(F, `Updating guild data (max_online_members: ${guildData.max_online_members})`);
  //   const newGuild = guildData;
  //   if (guildData.max_online_members) {
  //     // log.debug(F, `guildData.max_online_members: ${guildData.max_online_members}`);
  //     let maxCount = guildData.max_online_members;
  //     if (onlineCount > maxCount) {
  //       // log.debug(F, `onlineCount (${onlineCount}) > maxCount (${maxCount})`);
  //       maxCount = onlineCount;
  //       newGuild.max_online_members = maxCount;
  //       await guildUpdate(newGuild);
  //       // log.debug(F, 'Test0');
  //       const embed = embedTemplate()
  //         .setTitle(newRecordString)
  //         .setDescription(`We have reached ${maxCount} online members!`);

  //       const channelLounge = await tripsitGuild.channels.fetch(env.CHANNEL_LOUNGE) as TextChannel;
  //       if (channelLounge) {
  //         // log.debug(F, `channelLounge: ${channelLounge.name}`);
  //         const channelPerms = await checkChannelPermissions(channelLounge, [
  //           'SendMessages' as PermissionResolvable,
  //         ]);
  //         if (!channelPerms.hasPermission) {
  //           log.error(F, `I do not have the '${channelPerms.permission}' permission in ${channelLounge.name}!`);
  //           return;
  //         }
  //         await channelLounge.send({ embeds: [embed] });
  //         // log.debug(F, `Sent new record message to ${channelLounge.name}!`);
  //       }
  //       // log.debug(F, 'TestA');
  //       const channelTeamtripsit = await tripsitGuild.channels.fetch(env.CHANNEL_TEAMTRIPSIT) as TextChannel;
  //       if (channelTeamtripsit) {
  //         // log.debug(F, `channelTeamtripsit: ${channelTeamtripsit.name}`);
  //         const channelPerms = await checkChannelPermissions(channelTeamtripsit, [
  //           'SendMessages' as PermissionResolvable,
  //         ]);
  //         if (!channelPerms.hasPermission) {
  //           log.error(F, `I do not have the '${channelPerms.permission}' permission in ${channelTeamtripsit.name}!`);
  //           return;
  //         }
  //         await channelTeamtripsit.send({ embeds: [embed] });
  //         // log.debug(F, `Sent new record message to ${channelTeamtripsit.name}!`);
  //       }
  //       // log.debug(F, 'TestB');

  //       const channelMax = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_MAX);
  //       if (channelMax) {
  //         // log.debug(F, `channelMax: ${channelMax.name}`);
  //         const currentCount = parseInt(channelMax.name.split(': ')[1], 10);
  //         if (maxCount > currentCount) {
  //           const name = `Max: ${maxCount}`;
  //           if (channelMax.name !== name) {
  //             const channelPerms = await checkChannelPermissions(channelMax, [
  //               'ViewChannel' as PermissionResolvable,
  //               'Connect' as PermissionResolvable,
  //               'ManageChannels' as PermissionResolvable,
  //             ]);
  //             if (!channelPerms.hasPermission) {
  //               log.error(F, `I do not have the '${channelPerms.permission}' permission in ${channelMax.name}!`);
  //               return;
  //             }
  //             channelMax.setName(`Max: ${maxCount}`);
  //           }
  //           // log.debug(F, `Updated max online members to ${maxCount}!`);
  //         } else {
  //           // log.debug(F, `Max members is already ${maxCount}!`);
  //         }
  //       }
  //       // log.debug(F, 'TestC');
  //     }
  //   } else {
  //     // log.debug(F, `Updating guild data (max_online_members: ${onlineCount})`);
  //     newGuild.max_online_members = onlineCount;
  //     await guildUpdate(newGuild);
  //   }
  // }
}

/**
 * This function is called on start.ts and runs the timers
 */
export async function runStats() {
  /**
   * This timer runs every (INTERVAL) to determine if there are any tasks to perform
   * This function uses setTimeout so that it can finish running before the next loop
   */
  function checkTimers() {
    setTimeout(
      async () => {
        await checkStats();
        checkTimers();
      },
      interval,
    );
  }
  checkTimers();
}
