'use strict';

const { ReactionRole } = require('discordjs-reaction-role');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');
const { getGuildInfo } = require('../../global/services/firebaseAPI');

const {
  discordGuildId,
} = require('../../../env');

const activities = [
  { type: 'PLAYING', message: 'with fire' },
  { type: 'WATCHING', message: 'out for impure drugs' },
  { type: 'LISTENING', message: 'your commands' },
  { type: 'WATCHING', message: 'things you can not believe' },
];

async function getReactionRoles(client) {
  const tripsitGuild = client.guilds.resolve(discordGuildId);
  const [targetGuildData] = await getGuildInfo(tripsitGuild);
  const reactionRoles = targetGuildData.reactionRoles || null;
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
  logger.info(`[${PREFIX}] Reaction roles loaded!`);
}

async function getInvites(client) {
  /* Start *INVITE* code */
  // https://stackoverflow.com/questions/69521374/discord-js-v13-invite-tracker
  global.guildInvites = new Map();
  client.guilds.cache.forEach(guild => {
    if (guild.id !== discordGuildId) return;
    guild.invites.fetch()
      .then(invites => {
        logger.info(`[${PREFIX}] Invites cached!`);
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
    let state = 0;
    setInterval(() => {
      state = (state + 1) % activities.length;
      const presence = activities[state];
      client.user.setActivity(presence.message, { type: presence.type });
    }, 2500);
    logger.info(`[${PREFIX}] I am in ${client.guilds.cache.size} guilds.`);
    // run this async so that it runs while everything else starts too

    Promise.all([getReactionRoles(client), getInvites(client)])
      .then(() => logger.info(`[${PREFIX}] Discord bot fully inizialized: ready to fuck shit up!`));
  },
};
