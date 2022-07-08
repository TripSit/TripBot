'use strict';

const path = require('path');
const fs = require('fs/promises');
const { ReactionRole } = require('discordjs-reaction-role');
const logger = require('../utils/logger');
const { getGuildInfo } = require('../utils/firebase');
const { connectIRC, connectIRCBridge } = require('../utils/irc');
const { runTimer } = require('../utils/timer');
const { webserver } = require('../webserver/webserver');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const {
  NODE_ENV,
  discordGuildId,
  firebaseUserDbName,
  firebaseGuildDbName,
} = require('../../env');

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

async function updateGlobalDb() {
  const userDb = [];
  if (db !== undefined) {
    // Get user information
    const snapshotUser = await db.collection(firebaseUserDbName).get();
    snapshotUser.forEach(doc => {
      userDb.push({
        key: doc.id,
        value: doc.data(),
      });
    });
  }
  Object.assign(global, { userDb });
  // logger.debug(`[${PREFIX}] User database loaded.`);
  // logger.debug(`[${PREFIX}] userDb: ${JSON.stringify(global.userDb, null, 4)}`);
  logger.debug(`[${PREFIX}] Global User DB loaded!`);

  const guildDb = [];
  const blacklistGuilds = [];
  if (db !== undefined) {
    // Get guild information
    const snapshotGuild = await db.collection(firebaseGuildDbName).get();
    snapshotGuild.forEach(doc => {
      guildDb.push({
        key: doc.id,
        value: doc.data(),
      });
      if (doc.data().isBanned) {
        blacklistGuilds.push(doc.data().guild_id);
      }
    });
  }
  Object.assign(global, { guild_db: guildDb });
  logger.debug(`[${PREFIX}] Global Guild DB loaded!`);
  return userDb;
}

async function backupDb(userDb) {
  const today = Math.floor(Date.now() / 1000);
  if (NODE_ENV !== 'production') {
    await fs.writeFile(
      path.resolve(`./backups/userDb_(${today}).json`),
      JSON.stringify(userDb, null, 2),
    );
    logger.debug(`[${PREFIX}] User database backedup!`);
  }

  if (NODE_ENV !== 'production') {
    await fs.writeFile(
      path.resolve(`./backups/guild_db_(${today}).json`),
      JSON.stringify(global.guild_db, null, 2),
    );
    logger.debug(`[${PREFIX}] Guild database backedup!`);
  }
}

module.exports = {
  name: 'ready',
  once: true,

  async execute(client) {
    logger.debug(`[${PREFIX}] I am in ${client.guilds.cache.size} guilds.`);
    // run this async so that it runs while everything else starts too
    if (NODE_ENV === 'production') {
      // await connectIRCBridge(client);
    }
    await connectIRC(client);
    await getReactionRoles(client);
    await getInvites(client);
    const userDb = await updateGlobalDb(client);
    await backupDb(client, userDb);
    await runTimer(client);
    await webserver();
    logger.info(`[${PREFIX}] Ready to take over the world!`);
  },
};
