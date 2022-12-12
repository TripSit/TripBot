import {
  Client,
  Collection,
  Guild,
  Invite,
  TextChannel,
} from 'discord.js';
import { setTimeout } from 'timers/promises';
import { ReadyEvent } from '../@types/eventDef';
import { checkGuildPermissions } from '../utils/checkPermissions';

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
  client.guilds.cache.forEach(async (guild:Guild) => {
    if (guild.id !== env.DISCORD_GUILD_ID) return;
    // Fetch all Guild Invites
    const firstInvites = await guild.invites.fetch();
    // Set the key as Guild ID, and create a map which has the invite code, and the number of uses
    global.guildInvites.set(guild.id, new Collection(firstInvites.map((invite:Invite) => [invite.code, invite.uses])));
  });
}

export default ready;

export const ready: ReadyEvent = {
  name: 'ready',
  once: true,
  async execute(client) {
    const tripsitGuild = await client.guilds.fetch(env.DISCORD_GUILD_ID);
    await setTimeout(1000);
    startStatusLoop(client);
    Promise.all([checkGuildPermissions(client, tripsitGuild)]).then(async () => {
      Promise.all([getInvites(client)]).then(async () => {
        const bootDuration = (new Date().getTime() - global.bootTime.getTime()) / 1000;
        log.info(F, `Discord finished booting in ${bootDuration}s!`);
        if (env.NODE_ENV !== 'development') {
          const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
          const tripsitguild = client.guilds.cache.get(env.DISCORD_GUILD_ID) as Guild;
          const tripbotdevrole = tripsitguild.roles.cache.get(env.ROLE_TRIPBOTDEV);
          await botlog.send(`Hey ${tripbotdevrole}, bot has restart! Booted in ${bootDuration} seconds`);
        }
      });
    });
  },
};
