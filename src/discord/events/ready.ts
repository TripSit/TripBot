import {
  Client,
  Collection,
  Guild,
  Invite,
  PermissionResolvable,
  TextChannel,
} from 'discord.js';
import { setTimeout } from 'timers/promises';
import { ReadyEvent } from '../@types/eventDef';
import { checkGuildPermissions } from '../utils/checkPermissions';
import { runTimer } from '../../global/utils/timer'; // eslint-disable-line
import { runStats } from '../../global/utils/stats'; // eslint-disable-line
import { runRss } from '../../global/utils/rssCheck';
import { runVoiceCheck } from '../../global/utils/voiceExp';
import { startStatusLoop } from '../utils/statusLoop';

const F = f(__filename);

// Initialize the invite cache
global.guildInvites = new Collection();

/**
 * This gets invites from the guild and stores them in the global.guildInvites object.
 * This must be done onReady because otherwise the Guild isnt ready
 * @param {Client} client
 */
async function getInvites(client: Client) {
  // Loop over all the guilds
  client.guilds.fetch();
  client.guilds.cache.forEach(async (guild:Guild) => {
    if (guild.id !== env.DISCORD_GUILD_ID) return;
    const perms = await checkGuildPermissions(guild, [
      'ManageGuild' as PermissionResolvable,
    ]);

    if (perms.hasPermission) {
      // Fetch all Guild Invites
      const firstInvites = await guild.invites.fetch();
      // Set the key as Guild ID, and create a map which has the invite code, and the number of uses
      global.guildInvites.set(guild.id, new Collection(firstInvites.map((invite:Invite) => [invite.code, invite.uses])));
    } else {
      const guildOwner = await guild.fetchOwner();
      await guildOwner.send({ content: `Please make sure I can ${perms.permission} in ${guild} so I can fetch invites!` }); // eslint-disable-line
    }
  });
}

export default ready;

export const ready: ReadyEvent = {
  name: 'ready',
  once: true,
  async execute(client) {
    await setTimeout(1000);
    startStatusLoop(client);
    const hostGuild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
    await checkGuildPermissions(hostGuild, [
      'Administrator' as PermissionResolvable,
    ]).then(async result => {
      if (!result.hasPermission) {
        log.error(F, `I do not have the '${result.permission}' permission in ${hostGuild.name}!`);
        process.exit(1);
      }
      Promise.all([
        getInvites(client),
        runTimer(),
        runStats(),
        runVoiceCheck(),
        runRss(),
      ]).then(async () => {
        const bootDuration = (new Date().getTime() - global.bootTime.getTime()) / 1000;
        log.info(F, `Discord finished booting in ${bootDuration}s!`);
        if (env.NODE_ENV !== 'development') {
          const botlog = await client.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
          const guild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
          const tripbotdevrole = await guild.roles.fetch(env.ROLE_TRIPBOTDEV);
          await botlog.send(`Hey ${tripbotdevrole}, bot has restart! Booted in ${bootDuration} seconds`);
        }
      });
    });
  },
};
