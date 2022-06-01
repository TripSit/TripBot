'use strict';

const path = require('path');
const fs = require('fs/promises');
const express = require('express');
const { ReactionRole } = require('discordjs-reaction-role');
const logger = require('../utils/logger');
const { getGuildInfo } = require('../utils/firebase');
const { connectIRC } = require('../utils/irc');
const { runTimer } = require('../utils/timer');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const {
  NODE_ENV,
  discordGuildId,
  PORT,
  firebaseUserDbName,
  firebaseGuildDbName,
} = require('../../env');

module.exports = {
  name: 'ready',
  once: true,

  async execute(client) {
    // This takes a while so do it first
    connectIRC(client);

    const tripsitGuild = client.guilds.resolve(discordGuildId);
    async function getReactionRoles() {
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
    }

    getReactionRoles();

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

    runTimer(client);

    const today = Math.floor(Date.now() / 1000);
    if (NODE_ENV !== 'production') {
      await fs.writeFile(
        path.resolve(`./backups/userDb_(${today}).json`),
        JSON.stringify(userDb, null, 2),
      );
      // logger.debug(`[${PREFIX}] User database backedup.`);
    }

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
    // logger.debug(`[${PREFIX}] Guild database loaded.`);

    if (NODE_ENV !== 'production') {
      await fs.writeFile(
        path.resolve(`./backups/guild_db_(${today}).json`),
        JSON.stringify(global.guild_db, null, 2),
      );
      // logger.debug(`[${PREFIX}] Guild database backedup.`);
    }

    // logger.debug(`[${PREFIX}] blacklist_guilds: ${blacklist_guilds}`);
    // Check if the guild is in blacklist_guilds and if so, leave it
    logger.debug(`[${PREFIX}] I am in ${client.guilds.cache.size} guilds.`);

    // Setup the express server, this is necessary for the Digital Ocean health check
    // if (NODE_ENV === 'production') {
    const app = express();
    app.get('/', (req, res) => {
      res.status(200).send('Hello world!');
    });
    // TODO: Promisify this
    app.listen(PORT, () => {
      logger.debug(`[${PREFIX}] Healthcheck app listening on PORT ${PORT}`);
      logger.info(`[${PREFIX}] Ready to take over the world!`);
    });
    // }
  },
};
