const fs = require('node:fs');
const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
const { Collection } = require('discord.js');
const express = require('express');
const template = require('../utils/embed_template');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const db = global.db;
const PORT = process.env.PORT;
const guild_id = process.env.guildId;
const guild_db_name = process.env.guild_db_name;
const users_db_name = process.env.users_db_name;

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
        if (process.env.NODE_ENV == 'production') {
            const app = express();
            app.get('/', (req, res) => {res.status(200).send('Ok');});
            app.listen(PORT, () => {logger.debug(`[${PREFIX}] Healthcheck app listening on port ${PORT}`);});
        }

        /* Start *INVITE* code */
        // "ready" isn't really ready. We need to wait a spell.
        // await wait(1000);
        const today = Math.floor(Date.now() / 1000);

        // Loop over all the guilds
        client.guilds.cache.forEach(async (guild) => {
            if (guild.id == guild_id) {
                // Fetch all Guild tripsit Invites
                const firstInvites = await guild.invites.fetch();
                // Set the key as Guild ID, and create a map which has the invite code, and the number of uses
                client.invites.set(guild.id, new Collection(firstInvites.map((invite) => [invite.code, invite.uses])));
            }
        });
        /* End *INVITE* code */

        try {
            const guild_db = [];
            const snapshot_guild = await db.collection(guild_db_name).get();
            snapshot_guild.forEach((doc) => {
                const key = doc.id;
                const value = doc.data();
                guild_db.push({
                    key,
                    value,
                });
            });
            global.guild_db = guild_db;
        }
        catch (err) {
            logger.debug(`[${PREFIX}] Error getting guild firebase, make sure this is expected: ${err}`);
            global.guild_db = JSON.parse(fs.readFileSync('./src/assets/guild_db_example.json'));
        }
        if (process.env.NODE_ENV !== 'production') {
            fs.writeFileSync(`./src/backups/guild_db_(${today}).json`, JSON.stringify(global.guild_db, null, 2));
            logger.debug(`[${PREFIX}] Guild database backedup.`);
        }
        logger.debug(`[${PREFIX}] Guild database loaded.`);
        // logger.debug(`[${PREFIX}] guild_db: ${JSON.stringify(global.guild_db, null, 4)}`);


        try {
            const user_db = [];
            const snapshot_user = await db.collection(users_db_name).get();
            snapshot_user.forEach((doc) => {
                const key = doc.id;
                const value = doc.data();
                user_db.push({
                    key,
                    value,
                });
            });
            global.user_db = user_db;
        }
        catch (err) {
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
        global.guild_db.forEach((doc) => {
            // logger.debug(`[${PREFIX}] ${doc.id}, '=>', ${doc}`);
            if (doc.isBanned == true) {
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
        global.user_db.forEach((doc) => {
            // logger.debug(`[${PREFIX}] ${doc.id}, '=>', ${doc}`);
            if (doc.isBanned == true) {
                global.blacklist_users.push(doc.discord_id);
            }
        });
        logger.debug(`[${PREFIX}] blacklist_users: ${global.blacklist_users}`);

        async function checkReminders() {
            logger.debug(`[${PREFIX}] Checking reminders...`);
            global.user_db.forEach(async (doc) => {
                if (doc.reminders) {
                    const all_reminders = doc.reminders;
                    for (const reminder_time in doc.reminders) {
                        const user_fb_id = doc.id;
                        const userid = doc.discord_id;
                        const remindertime = parseInt(reminder_time);
                        const reminder = all_reminders[remindertime];
                        logger.debug(`[${PREFIX}] ${userid} has a reminder on ${remindertime}`);
                        if (remindertime <= Date.now() / 1000) {
                            logger.debug(`[${PREFIX}] Sending reminder to ${userid}`);
                            const user = await client.users.fetch(userid);
                            const reminder_embed = template.embed_template()
                                .setTitle('Reminder!')
                                .setDescription(`You set a reminder to ${reminder}`);
                            user.send({ embeds: [reminder_embed] });
                            // remove the reminder
                            // delete doc.reminders[remindertime];
                            delete all_reminders[remindertime];
                            db.collection(users_db_name).doc(user_fb_id).update({
                                reminders: all_reminders,
                            });
                        }
                    }
                }

            });
        }
        checkReminders();
        setInterval(checkReminders, 60000);

        logger.info(`[${PREFIX}] Ready to take over the world!`);
    },
};