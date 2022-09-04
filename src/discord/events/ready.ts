import {
  Client,
  Collection,
} from 'discord.js';
import env from '../../global/utils/env.config';
import {setTimeout} from 'timers/promises';
import logger from '../../global/utils/logger';

import {startStatusLoop} from '../utils/statusLoop';

// const { ReactionRole } = require('discordjs-reaction-role');
const PREFIX = require('path').parse(__filename).name;

// Initialize the invite cache
global.guildInvites = new Collection();

/**
 * This gets invites from the guild and stores them in the global.guildInvites object.
 * This must be done onReady because otherwise the Guild isnt ready
 * @param {Client} client
 */
async function getInvites(client: Client) {
  // Loop over all the guilds
  client.guilds.cache.forEach(async (guild) => {
    if (guild.id !== env.DISCORD_GUILD_ID.toString()) return;
    // Fetch all Guild Invites
    const firstInvites = await guild.invites.fetch();
    // Set the key as Guild ID, and create a map which has the invite code, and the number of uses
    global.guildInvites.set(guild.id, new Collection(firstInvites.map((invite) => [invite.code, invite.uses])));
  });
}

module.exports = {
  name: 'ready',
  once: true,
  async execute(client: Client) {
    await setTimeout(1000);
    startStatusLoop(client);
    Promise.all([getInvites(client)])
        .then(() => {
          const bootDuration = (new Date().getTime() - global.bootTime.getTime()) / 1000;
          logger.info(`[${PREFIX}] Discord finished booting in ${bootDuration}s!`);
        })
    ;
  },
};
