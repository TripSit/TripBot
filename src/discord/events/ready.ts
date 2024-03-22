import { setTimeout } from 'timers/promises';
import {
  Client,
  Collection,
  Guild,
  Invite,
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import ms from 'ms';
import fs from 'fs/promises';
import path from 'path';
import { ReadyEvent } from '../@types/eventDef';
import { checkGuildPermissions } from '../utils/checkPermissions';
import runTimer from '../../global/utils/timer'; // eslint-disable-line
import { emojiCache } from '../utils/emoji';
import { populateBans } from '../utils/populateBotBans'; // eslint-disable-line
import { fact } from '../../global/commands/g.fact';
import { botStats } from '../../global/commands/g.botstats';
// import { runLpm } from '../utils/lpm';

const F = f(__filename);

// Initialize the invite cache
global.guildInvites = new Collection();

/**
 * This gets invites from the guild and stores them in the global.guildInvites object.
 * This must be done onReady because otherwise the Guild isn't ready
 * @param {Client} discordClient
 */
async function getInvites(discordClient: Client) {
  // Loop over all the guilds
  discordClient.guilds.fetch();
  discordClient.guilds.cache.forEach(async (guild:Guild) => {
    if (guild.id !== env.DISCORD_GUILD_ID) return;
    const perms = await checkGuildPermissions(guild, [
      'ManageGuild' as PermissionResolvable,
    ]);

    if (perms.length === 0) {
      // Fetch all Guild Invites
      const firstInvites = await guild.invites.fetch();
      // Set the key as Guild ID, and create a map which has the invite code, and the number of uses
      global.guildInvites
        .set(guild.id, new Collection(firstInvites
          .map((invite:Invite) => [invite.code, invite.uses])));
    } else {
      const guildOwner = await guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.join(', ')} in ${guild} so I can fetch invites!` }); // eslint-disable-line
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
  name: 'ready',
  once: true,
  async execute(client) {
    // log.debug(F, 'ready event fired');
    await setTimeout(1000);
    const hostGuild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID);
    await checkGuildPermissions(hostGuild, [
      // 'Administrator' as PermissionResolvable,
    ]).then(async result => {
      if (result.length > 0) {
        log.error(F, `I do not have the '${result.join(', ')}' permission in ${hostGuild.name}!`);
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
        const bootDuration = (new Date().getTime() - global.bootTime.getTime()) / 1000;

        // update the profile banner
        try {
          const imageBuffer = await fs.readFile(path.resolve(__dirname, '../../../assets/img/banner.gif'));
          await discordClient.rest.patch('/users/@me', {
            body: { banner: `data:image/gif;base64,${imageBuffer.toString('base64')}` },
          });
        } catch (e) {
          // log.error(F, `Error updating profile banner: ${e}`);
        }
        log.info(F, `Discord finished booting in ${bootDuration}s!`);
        if (env.NODE_ENV !== 'development') {
          const channelTripbot = await discordClient.channels.fetch(env.CHANNEL_TRIPBOT) as TextChannel;
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
          const guildStr = `Guilds:   ${statData.guildCount.toString()}`;
          const channelStr = `Channels: ${statData.channelCount.toString()}`;
          const userStr = `Users:    ${statData.userCount.toString()}`;
          const commandStr = `Commands: ${statData.commandCount.toString()}`;
          const pingStr = `Ping:     ${statData.ping.toString()}ms`;
          const botUptimeStr = `Bot Up:   ${ms(statData.uptime)}`;

          const networkStr = `Network:  ${statData.netDown} down, ${statData.netUp} up`;
          const cpuStr = `CPU:      ${cpuPercentPadded} of ${statData.cpuCount.toString()} cores`;
          const memStr = `Memory:   ${memPercentPadded} of ${statData.memTotal.toString()} MB`;
          const driveStr = `Drive:    ${drivePercentPadded} of ${statData.driveTotal.toString()} GB`;
          const dbStr = `Drug DB:  ${statData.tsDbSize.toString()} TS, ${statData.tsPwDbSize.toString()} TS+PW`;
          const hostUptimeStr = `Host Up:  ${ms(statData.hostUptime)}`;

          const columns = [
            [guildStr, dbStr],
            [channelStr, memStr],
            [userStr, driveStr],
            [commandStr, cpuStr],
            [botUptimeStr, networkStr],
            [pingStr, hostUptimeStr],
          ];

          const longest = columns.reduce((long, str) => Math.max(long, str[0].length), 0);
          const message = columns.map(col => `${col[0].padEnd(longest)}  ${col[1]}`).join('\n');

          await channelTripbot.send(stripIndents`
        Hey ${botOwner} I just rebooted in ${bootDuration} seconds!
        \`\`\`${message}\`\`\`*${newFact}*
        `);
        }
      });
    });
  },
};

export default ready;
