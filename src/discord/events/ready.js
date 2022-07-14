'use strict';

const path = require('path');
const { ReactionRole } = require('discordjs-reaction-role');
const logger = require('../../global/logger');
const { getGuildInfo } = require('../../global/firebaseAPI');

const PREFIX = path.parse(__filename).name;

const {
  discordGuildId,
} = require('../../../env');

async function getReactionRoles(client) {
  const tripsitGuild = client.guilds.resolve(discordGuildId);
  const [targetGuildData] = await getGuildInfo(tripsitGuild);
  const reactionRoles = targetGuildData.reactionRoles;
  // logger.debug(`[${PREFIX}] reactionRoles: ${JSON.stringify(reactionRoles, null, 2)}`);
  if (reactionRoles) {
    let reactionConfig = [];
    Object.keys(reactionRoles).forEach(key => {
      // logger.debug(`[${PREFIX}] key: ${key}`);
      // reactionConfig = reactionRoles[key]; this works
      reactionConfig = reactionConfig.concat(reactionRoles[key]);
    });
    // logger.debug(`[${PREFIX}] reactionConfig: ${JSON.stringify(reactionConfig, null, 2)}`);
    global.manager = new ReactionRole(client, reactionConfig);
  }
  logger.debug(`[${PREFIX}] Reaction roles loaded!`);
}

async function getInvites(client) {
  /* Start *INVITE* code */
  // https://stackoverflow.com/questions/69521374/discord-js-v13-invite-tracker
  global.guildInvites = new Map();
  client.guilds.cache.forEach(guild => {
    if (guild.id !== discordGuildId) return;
    guild.invites.fetch()
      .then(invites => {
        logger.debug(`[${PREFIX}] Invites cached!`);
        const codeUses = new Map();
        invites.each(inv => codeUses.set(inv.code, inv.uses));
        global.guildInvites.set(guild.id, codeUses);
      })
      .catch(err => {
        logger.debug(`[${PREFIX}] OnReady Error: ${err}`);
      });
  });
  /* End *INVITE* code */
}
module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.debug(`[${PREFIX}] I am in ${client.guilds.cache.size} guilds.`);
    // run this async so that it runs while everything else starts too
    await getReactionRoles(client);
    await getInvites(client);
  },
};
