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
 * This gets reaction roles and stores them
 * @param {Client} client
 */
// async function getReactionRoles(client: Client) {
//   const ref = db.ref(`${env.FIREBASE_DB_GUILDS}/${env.DISCORD_GUILD_ID}/reactionRoles`);

//   await ref.once('value', (data) => {
//     if (data.val() !== null) {
//       const reactionRoles = data.val();
//       logger.debug(`[${PREFIX}] reactionRoles: ${JSON.stringify(reactionRoles, null, 2)}`);
//       let reactionConfig = [];
//       Object.keys(reactionRoles).forEach((key) => {
//         logger.debug(`[${PREFIX}] key: ${key}`);
//         // reactionConfig = reactionRoles[key]; this works
//         reactionConfig = reactionConfig.concat(reactionRoles[key]);
//       });
//       // logger.debug(`[${PREFIX}] reactionConfig: ${JSON.stringify(reactionConfig, null, 2)}`);
//       global.reactionRoles = new ReactionRole(client, reactionConfig);
//     }
//   });
// logger.info(`[${PREFIX}] Reaction roles loaded!`);
// }

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
    // Promise.all([getReactionRoles(client)])
    //     .then(() => logger.info(`[${PREFIX}] finished!`));
    Promise.all([getInvites(client)])
        .then(() => {
          const bootDuration = (new Date().getTime() - global.bootTime.getTime()) / 1000;
          logger.info(`[${PREFIX}] Discord finished booting in ${bootDuration}s!`);
        })
    ;
  },
};
