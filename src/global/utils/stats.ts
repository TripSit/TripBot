import {
  TextChannel,
} from 'discord.js';
import { getGuild, guildUpdate } from './knex';

import { embedTemplate } from '../../discord/utils/embedTemplate';

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

  // Total member count
  const { memberCount } = tripsitGuild;
  // log.debug(F, `memberCount: ${memberCount}`);
  const channelTotal = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_TOTAL);
  // log.debug(F, `channelTotal: ${channelTotal?.name}`);
  if (channelTotal) {
    const name = `Total: ${memberCount}`;
    if (channelTotal.name !== name) {
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
  const roleVerified = await tripsitGuild.roles.fetch(env.ROLE_VERIFIED);
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
        await channelVerified.setName(name);
        // log.debug(F, `Updated verified members to ${members.size}!`);
        if (members.size % 100 === 0) {
          const embed = embedTemplate()
            .setTitle(newRecordString)
            .setDescription(`We have reached ${members.size} verified members!`);
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
    }
  } else {
    log.error(F, 'Could not find role verified!');
  }

  // Determine the number of users currently online
  const onlineCount = tripsitGuild.members.cache.filter(
    member => member.presence?.status !== undefined && member.presence?.status !== 'offline',
  ).size;
  const channelOnline = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_ONLINE);
  if (channelOnline) {
    const name = `Online: ${onlineCount}`;
    if (channelOnline.name !== name) {
      channelOnline.setName(name);
    }
  }

  // Update the database's max_online_members if it's higher than the current value
  // log.debug(F, `Getting guild data`);
  const guildData = await getGuild(env.DISCORD_GUILD_ID);
  if (guildData) {
    const newGuild = guildData;
    if (guildData.max_online_members) {
      let maxCount = guildData.max_online_members;
      if (onlineCount > maxCount) {
        maxCount = onlineCount;
        newGuild.max_online_members = maxCount;
        await guildUpdate(newGuild);
        const embed = embedTemplate()
          .setTitle(newRecordString)
          .setDescription(`We have reached ${maxCount} online members!`);
        const channelLounge = await tripsitGuild.channels.fetch(env.CHANNEL_LOUNGE) as TextChannel;
        if (channelLounge) {
          await channelLounge.send({ embeds: [embed] });
        }
        const channelTeamtripsit = await tripsitGuild.channels.fetch(env.CHANNEL_TEAMTRIPSIT) as TextChannel;
        if (channelTeamtripsit) {
          await channelTeamtripsit.send({ embeds: [embed] });
        }

        const channelMax = await tripsitGuild.channels.fetch(env.CHANNEL_STATS_MAX);
        if (channelMax) {
          const currentCount = parseInt(channelMax.name.split(': ')[1], 10);
          // log.debug(F, `currentCount: ${currentCount} | maxCount: ${maxCount}`);
          if (maxCount > currentCount) {
            const name = `Max: ${maxCount}`;
            if (channelMax.name !== name) {
              channelMax.setName(`Max: ${maxCount}`);
            }
            // log.debug(F, `Updated max online members to ${maxCount}!`);
          } else {
            // log.debug(F, `Max members is already ${maxCount}!`);
          }
        }
      }
    } else {
      newGuild.max_online_members = onlineCount;
      await guildUpdate(newGuild);
    }
  }
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
