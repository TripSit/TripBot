import type { Client, Guild, Invite, PermissionResolvable, TextChannel } from 'discord.js';

import { stripIndents } from 'common-tags';
import { Collection } from 'discord.js';
import ms from 'ms';
import { setTimeout } from 'node:timers/promises';

import type { ReadyEvent } from '../@types/eventDef';

import { botStats } from '../../global/commands/g.botstats';
import { fact } from '../../global/commands/g.fact';
import runTimer from '../../global/utils/timer';
import { checkGuildPermissions } from '../utils/checkPermissions';
import { emojiCache } from '../utils/emoji';
import { populateBans } from '../utils/populateBotBans';
// import { runLpm } from '../utils/lpm';

const F = f(__filename);

// Initialize the invite cache
globalThis.guildInvites = new Collection();

/**
 * This gets invites from the guild and stores them in the global.guildInvites object.
 * This must be done onReady because otherwise the Guild isn't ready
 * @param {Client} discordClient
 */
async function getInvites(discordClient: Client) {
  // Loop over all the guilds
  discordClient.guilds.fetch();
  discordClient.guilds.cache.forEach(async (guild: Guild) => {
    if (guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }
    const perms = await checkGuildPermissions(guild, ['ManageGuild' as PermissionResolvable]);

    if (perms.hasPermission) {
      // Fetch all Guild Invites
      const firstInvites = await guild.invites.fetch();
      // Set the key as Guild ID, and create a map which has the invite code, and the number of uses
      globalThis.guildInvites.set(
        guild.id,
        new Collection(firstInvites.map((invite: Invite) => [invite.code, invite.uses])),
      );
    } else {
      const guildOwner = await guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.permission} in ${guild} so I can fetch invites!` }); // eslint-disable-line
    }
  });
}

// async function refreshCache() {
//   // Loop over all the guilds
//   await discordClient.guilds.fetch();
//   discordClient.guilds.cache.forEach(async (guild:Guild) => {
//     await guild.members.fetch();
//     await guild.roles.fetch();
//     await guild.channels.fetch();
//     try {
//       await guild.bans.fetch();
//     } catch (e) {
//       // log.error(F, `Error fetching bans for guild ${guild.name} (${guild.id}): ${e}`);
//     }
//     await guild.emojis.fetch();
//   });
// }

export const ready: ReadyEvent = {
  async execute(client) {
    // log.debug(F, 'ready event fired');
    await setTimeout(1000);
    const hostGuild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
    await checkGuildPermissions(hostGuild, [
      // 'Administrator' as PermissionResolvable,
    ]).then(async (result) => {
      if (!result.hasPermission) {
        log.error(F, `I do not have the '${result.permission}' permission in ${hostGuild.name}!`);
        process.exit(1);
      }
      Promise.all([
        getInvites(client),
        emojiCache(client),
        populateBans(),
        // refreshCache(),

        // Timers
        runTimer(),
      ]).then(async () => {
        const bootDuration = (Date.now() - globalThis.bootTime.getTime()) / 1000;
        log.info(F, `Discord finished booting in ${bootDuration}s!`);
        if (env.NODE_ENV !== 'development') {
          const channelTripbot = (await discordClient.channels.fetch(
            env.CHANNEL_TRIPBOT,
          )) as TextChannel;
          // log.debug(F, `channelTripbot: ${JSON.stringify(channelTripbot, null, 2)}`);
          const botOwner = await discordClient.users.fetch(env.DISCORD_OWNER_ID);
          // log.debug(F, `botOwner: ${JSON.stringify(botOwner, null, 2)}`);
          // const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
          // const tripbotDevRole = await guild.roles.fetch(env.ROLE_TRIPBOTDEV);
          const newFact = await fact();
          const statData = await botStats();
          const drivePercentPadded = `${statData.driveUsage.toString()}%`.padEnd(3, ' ');
          const memPercentPadded = `${statData.memUsage.toString()}%`.padEnd(3, ' ');
          const cpuPercentPadded = `${statData.cpuUsage.toString()}%`.padEnd(3, ' ');
          const guildString = `Guilds:   ${statData.guildCount.toString()}`;
          const channelString = `Channels: ${statData.channelCount.toString()}`;
          const userString = `Users:    ${statData.userCount.toString()}`;
          const commandString = `Commands: ${statData.commandCount.toString()}`;
          const pingString = `Ping:     ${statData.ping.toString()}ms`;
          const botUptimeString = `Bot Up:   ${ms(statData.uptime)}`;

          const networkString = `Network:  ${statData.netDown} down, ${statData.netUp} up`;
          const cpuString = `CPU:      ${cpuPercentPadded} of ${statData.cpuCount.toString()} cores`;
          const memString = `Memory:   ${memPercentPadded} of ${statData.memTotal.toString()} MB`;
          const driveStr = `Drive:    ${drivePercentPadded} of ${statData.driveTotal.toString()} GB`;
          const dbStr = `Drug DB:  ${statData.tsDbSize.toString()} TS, ${statData.tsPwDbSize.toString()} TS+PW`;
          const hostUptimeStr = `Host Up:  ${ms(statData.hostUptime)}`;

          const columns = [
            [guildString, dbStr],
            [channelString, memString],
            [userString, driveStr],
            [commandString, cpuString],
            [botUptimeString, networkString],
            [pingString, hostUptimeStr],
          ];

          const longest = columns.reduce((long, string_) => Math.max(long, string_[0].length), 0);
          const message = columns.map((col) => `${col[0].padEnd(longest)}  ${col[1]}`).join('\n');

          await channelTripbot.send(stripIndents`
        Hey ${botOwner} I just rebooted in ${bootDuration} seconds!
        \`\`\`${message}\`\`\`*${newFact}*
        `);
        }
      });
    });
  },
  name: 'ready',
  once: true,
};

export default ready;
