'use strict';

const path = require('path');
const fs = require('fs/promises');
const { Collection } = require('discord.js');
const express = require('express');
const logger = require('../utils/logger');
const template = require('../utils/embed-template');
const { NODE_ENV, TRIPSIT_GUILD_ID } = require('../../env');

const PREFIX = path.parse(__filename).name;

const { db } = global;
const {
  PORT,
  users_db_name: usersDbName,
  guild_db_name: guildDbName,
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
    // Setup the express server, this is necessary for the Digital Ocean health check
    if (NODE_ENV === 'production') {
      const app = express();
      app.get('/', (req, res) => {
        res.status(200).send('Ok');
      });
      // TODO: Promisify this
      app.listen(PORT, () => {
        logger.debug(`[${PREFIX}] Healthcheck app listening on port ${PORT}`);
      });
    }

    /* Start *INVITE* code */
    // "ready" isn't really ready. We need to wait a spell.
    // await wait(1000);
    // TODO: luxon
    const today = Math.floor(Date.now() / 1000);

    // Loop over all the guilds
    client.guilds.cache.forEach(async guild => {
      if (guild.id === TRIPSIT_GUILD_ID) {
        // Fetch all Guild tripsit Invites
        let firstInvites = [];
        try {
          firstInvites = await guild.invites.fetch(); // TODO: Promisify
          // Set the key as Guild ID, and create a map which has the invite code
          // and the number of uses
        } catch (err) {
          logger.error(`[${PREFIX}] Error fetching invites: ${err}`);
        }
        client.invites.set(
          guild.id,
          new Collection(firstInvites.map(invite => [invite.code, invite.uses])),
        );
      }
    });
    /* End *INVITE* code */

    const userDb = [];
    if (db !== undefined) {
      // Get user information
      const snapshotUser = await db.collection(usersDbName).get();
      snapshotUser.forEach(doc => {
        userDb.push({
          key: doc.id,
          value: doc.data(),
        });
      });
    }
    Object.assign(global, { user_db: userDb });
    logger.debug(`[${PREFIX}] User database loaded.`);
    // logger.debug(`[${PREFIX}] user_db: ${JSON.stringify(global.user_db, null, 4)}`);

    if (NODE_ENV !== 'production') {
      await fs.writeFile(
        path.resolve(`./backups/user_db_(${today}).json`),
        JSON.stringify(userDb, null, 2),
      );
      logger.debug(`[${PREFIX}] User database backedup.`);
    }

    const guildDb = [];
    const blacklistGuilds = [];
    if (db !== undefined) {
      // Get guild information
      const snapshotGuild = await db.collection(guildDbName).get();
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
    logger.debug(`[${PREFIX}] Guild database loaded.`);

    if (NODE_ENV !== 'production') {
      await fs.writeFile(
        path.resolve(`./backups/guild_db_(${today}).json`),
        JSON.stringify(global.guild_db, null, 2),
      );
      logger.debug(`[${PREFIX}] Guild database backedup.`);
    }

    // logger.debug(`[${PREFIX}] blacklist_guilds: ${blacklist_guilds}`);
    // Check if the guild is in blacklist_guilds and if so, leave it
    logger.debug(`[${PREFIX}] I am in:`);
    client.guilds.cache.forEach(guild => {
      logger.debug(`[${PREFIX}] ${guild.name}`);
      if (blacklistGuilds.includes(guild.id)) {
        logger.info(`[${PREFIX}] ${guild.name} is banned, leaving!`);
        guild.leave();
      }
    });

    async function checkReminders() {
      // logger.debug(`[${PREFIX}] Checking reminders...`);
      global.user_db.forEach(async doc => {
        if (doc.value.reminders) {
          const userReminders = doc.value.reminders;
          // eslint-disable-next-line
          // logger.debug(`[${PREFIX}] doc.value.reminders ${JSON.stringify(all_reminders, null, 4)}`);
          // Loop over doc.value.reminders keys
          Object.keys(userReminders).forEach(async reminderTime => {
            const userFbId = doc.key;
            // logger.debug(`[${PREFIX}] user_fb_id: ${user_fb_id}`);
            const userid = doc.value.discord_id;
            // logger.debug(`[${PREFIX}] userid: ${userid}`);
            const remindertime = parseInt(reminderTime, 10);
            // logger.debug(`[${PREFIX}] remindertime: ${remindertime}`);
            const reminder = userReminders[remindertime];
            // logger.debug(`[${PREFIX}] reminder: ${reminder}`);
            // logger.debug(`[${PREFIX}] ${userid} has a reminder on ${remindertime}`);
            if (remindertime <= Date.now() / 1000) {
              logger.debug(`[${PREFIX}] Sending reminder to ${userid}`);
              // TODO: Use Promise.all with [].map for concurrency
              const user = await client.users.fetch(userid);
              const reminderEmbed = template.embedTemplate()
                .setTitle('Reminder!')
                .setDescription(`${reminder}`);
              user.send({ embeds: [reminderEmbed] });
              // remove the reminder
              delete userReminders[remindertime];
              // logger.debug(`[${PREFIX}] Removing reminder from all_reminders`);
              // logger.debug(`[${PREFIX}] doc.value: ${JSON.stringify(doc.value, null, 4)}`);
              db.collection(usersDbName).doc(userFbId).update(doc.value);
              // logger.debug(`[${PREFIX}] Removing reminder from db`);
            }
          });
        }
      });
    }

    // async function checkReminders() {
    //   logger.debug(`[${PREFIX}] Checking reminders...`);
    //   return global.user_db.map(async doc => {
    //     if (doc.reminders) {
    //       const userReminders = doc.reminders;
    //       return Promise.all(userReminders.map(reminderTime => {
    //         const userFbId = doc.id;
    //         const userid = doc.discord_id;
    //         const remindertime = parseInt(reminderTime, 10);
    //         const reminder = userReminders[remindertime];
    //         logger.debug(`[${PREFIX}] ${userid} has a reminder on ${remindertime}`);
    //         if (remindertime <= Date.now() / 1000) {
    //           logger.debug(`[${PREFIX}] Sending reminder to ${userid}`);
    //           // TODO: Unknown reference
    //           return client.users.fetch(userid).then(user => {
    //             const reminderEmbed = template.embedTemplate()
    //               .setTitle('Reminder!')
    //               .setDescription(`You set a reminder to ${reminder}`);
    //             user.send({ embeds: [reminderEmbed] });
    //             // remove the reminder
    //             // delete doc.reminders[remindertime];
    //             delete userReminders[remindertime];
    //             return db.collection(usersDbName).doc(userFbId).update({
    //               reminders: userReminders,
    //             });
    //           });
    //         }
    //         return null;
    //       }));
    //     }
    //     return null;
    //   });
    // }
    checkReminders();
    // eslint-disable-next-line
    // TODO: setInterval can cause unwanted side-effects, use recursive function w/ setTimeout
    setInterval(checkReminders, 1000);

    logger.info(`[${PREFIX}] Ready to take over the world!`);
  },
};
