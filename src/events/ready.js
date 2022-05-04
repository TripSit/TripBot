'use strict';

const fs = require('fs');
const PREFIX = require('path').parse(__filename).name;
const { Collection } = require('discord.js');
const express = require('express');
const logger = require('../utils/logger');
const template = require('../utils/embed-template');
const { NODE_ENV, TRIPSIT_GUILD_ID } = require('../../env');

const { db } = global;
const {
  PORT,
  guild_db_name: guildDbName,
  users_db_name: usersDbName,
} = process.env;

// (*INVITE*) https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/tracking-used-invites.md
/* Start *INVITE* code */
// Initialize the invite cache
// const invites = new Collection();
// A pretty useful method to create a delay without blocking the whole script.
// const wait = require('timers/promises').setTimeout;
/* End *INVITE* code */

module.exports = {
  name: 'ready',
  once: true,

  async execute(client) {
    // This takes a while so do it first
    // Setup the express server, this is necessary for the DO health check
    if (NODE_ENV === 'production') {
      const app = express();
      app.get('/', (req, res) => { res.status(200).send('Ok'); });
      app.listen(PORT, () => { logger.debug(`[${PREFIX}] Healthcheck app listening on port ${PORT}`); });
    }

    /* Start *INVITE* code */
    // "ready" isn't really ready. We need to wait a spell.
    // await wait(1000);
    const today = Math.floor(Date.now() / 1000);

    // Loop over all the guilds
    client.guilds.cache.forEach(async guild => {
      if (guild.id === TRIPSIT_GUILD_ID) {
        // Fetch all Guild tripsit Invites
        const firstInvites = await guild.invites.fetch();
        // Set the key as Guild ID, and create a map which has the invite code
        // and the number of uses
        client.invites.set(
          guild.id,
          new Collection(firstInvites.map(invite => [invite.code, invite.uses])),
        );
      }
    });
    /* End *INVITE* code */

    try {
      const snapshotGuild = await db.collection(guildDbName).get();
      const guildDb = snapshotGuild.map(doc => ({
        key: doc.id,
        value: doc.data(),
      }));
      global.guild_db = guildDb; // TODO: Remove global
    } catch (err) {
      logger.debug(`[${PREFIX}] Error getting guild firebase, make sure this is expected: ${err}`);
      global.guild_db = JSON.parse(fs.readFileSync('./src/assets/guild_db_example.json'));
    }
    if (NODE_ENV !== 'production') {
      fs.writeFileSync(`./src/backups/guild_db_(${today}).json`, JSON.stringify(global.guild_db, null, 2));
      logger.debug(`[${PREFIX}] Guild database backedup.`);
    }
    logger.debug(`[${PREFIX}] Guild database loaded.`);
    // logger.debug(`[${PREFIX}] guild_db: ${JSON.stringify(global.guild_db, null, 4)}`);

    try {
      const snapshotUser = await db.collection(usersDbName).get();
      const userDb = snapshotUser.map(doc => ({
        key: doc.id,
        value: doc.data(),
      }));
      global.user_db = userDb; // TODO: Remove global
    } catch (err) {
      logger.debug(`[${PREFIX}] Error getting user firebase, make sure this is expected: ${err}`);
      global.user_db = JSON.parse(fs.readFileSync('./src/assets/user_db_example.json'));
    }
    if (process.env.NODE_ENV !== 'production') {
      fs.writeFileSync(`./src/backups/user_db_(${today}).json`, JSON.stringify(global.user_db, null, 2));
      logger.debug(`[${PREFIX}] User database backedup.`);
    }
    logger.debug(`[${PREFIX}] User database loaded.`);
    // logger.debug(`[${PREFIX}] user_db: ${JSON.stringify(global.user_db, null, 4)}`);

    // Print each guild I am in
    logger.debug(`[${PREFIX}] I am in:`);
    client.guilds.cache.forEach(guild => {
      logger.debug(`[${PREFIX}] ${guild.name}`);
    });

    // Set the global banned guilds
    global.blacklist_guilds = [];
    global.guild_db.forEach(doc => {
      // logger.debug(`[${PREFIX}] ${doc.id}, '=>', ${doc}`);
      if (doc.isBanned) {
        global.blacklist_guilds.push(doc.guild_id);
      }
    });
    logger.debug(`[${PREFIX}] blacklist_guilds: ${global.blacklist_guilds}`);

    // Check if the guild is in blacklist_guilds and if so, leave it
    client.guilds.cache.forEach(guild => {
      if (global.blacklist_guilds.includes(guild.id)) {
        logger.info(`[${PREFIX}] Leaving ${guild.name}`);
        guild.leave();
      }
    });

    // Set the global banned users
    global.blacklist_users = [];
    global.user_db.forEach(doc => {
      // logger.debug(`[${PREFIX}] ${doc.id}, '=>', ${doc}`);
      if (doc.isBanned) {
        global.blacklist_users.push(doc.discord_id);
      }
    });
    logger.debug(`[${PREFIX}] blacklist_users: ${global.blacklist_users}`);

    async function checkReminders() {
      logger.debug(`[${PREFIX}] Checking reminders...`);
      return global.user_db.map(async doc => {
        if (doc.reminders) {
          const allReminders = doc.reminders;
          return Promise.all(allReminders.map(reminderTime => {
            const userFbId = doc.id;
            const userid = doc.discord_id;
            const remindertime = parseInt(reminderTime, 10);
            const reminder = allReminders[remindertime];
            logger.debug(`[${PREFIX}] ${userid} has a reminder on ${remindertime}`);
            if (remindertime <= Date.now() / 1000) {
              logger.debug(`[${PREFIX}] Sending reminder to ${userid}`);
              // TODO: Unknown reference
              return client.users.fetch(userid).then(user => {
                const reminderEmbed = template.embedTemplate()
                  .setTitle('Reminder!')
                  .setDescription(`You set a reminder to ${reminder}`);
                user.send({ embeds: [reminderEmbed] });
                // remove the reminder
                // delete doc.reminders[remindertime];
                delete allReminders[remindertime];
                return db.collection(usersDbName).doc(userFbId).update({
                  reminders: allReminders,
                });
              });
            }
            return null;
          }));
        }
        return null;
      });
    }
    checkReminders();
    // eslint-disable-next-line
    setInterval(checkReminders, 60000); // TODO: setInterval can cause unwanted side-effects, use recursive function w/ setTimeout

    logger.info(`[${PREFIX}] Ready to take over the world!`);
  },
};
