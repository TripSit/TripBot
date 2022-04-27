const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
const { MessageEmbed } = require('discord.js');
const { getFirestore } = require('firebase-admin/firestore');
const express = require('express');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const PORT = process.env.PORT;
const ts_icon_url = process.env.ts_icon_url;
const guild_db_name = process.env.guild_db_name;
const users_db_name = process.env.users_db_name;

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        const db = getFirestore();
        global.guild_db = await db.collection(guild_db_name).get();
        global.user_db = await db.collection(users_db_name).get();

        // Print each guild I am in
        logger.debug(`[${PREFIX}] I am in:`);
        client.guilds.cache.forEach(guild => {
            logger.debug(`[${PREFIX}] ${guild.name}`);
        });

        // Set the global banned guilds
        global.blacklist_guilds = [];
        global.guild_db.forEach((doc) => {
            // logger.debug(`[${PREFIX}] ${doc.id}, '=>', ${doc.data()}`);
            if (doc.data().isBanned == true) {
                global.blacklist_guilds.push(doc.data().guild_id);
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
            // logger.debug(`[${PREFIX}] ${doc.id}, '=>', ${doc.data()}`);
            if (doc.data().isBanned == true) {
                global.blacklist_users.push(doc.data().discord_id);
            }
        });
        logger.debug(`[${PREFIX}] blacklist_users: ${global.blacklist_users}`);

        // Setup the express server, this is necessary for the DO health check
        function setupExpress() {
            
            const app = express();
            app.get('/', (req, res) => {res.status(200).send('Ok');});
            app.listen(PORT, () => {logger.debug(`[${PREFIX}] Healthcheck app listening on port ${PORT}`);});
        }
        setupExpress();

        async function checkReminders() {
            global.user_db.forEach(async (doc) => {
                if (doc.data().reminders) {
                    const all_reminders = doc.data().reminders;
                    for (const reminder_time in doc.data().reminders) {
                        const user_fb_id = doc.id;
                        const userid = doc.data().discord_id;
                        const remindertime = parseInt(reminder_time);
                        const reminder = all_reminders[remindertime];
                        logger.debug(`[${PREFIX}] ${userid} has a reminder on ${remindertime}`);
                        if (remindertime <= Date.now() / 1000) {
                            logger.debug(`[${PREFIX}] Sending reminder to ${userid}`);
                            const user = await client.users.fetch(userid);
                            const reminder_embed = new MessageEmbed()
                                .setColor('RANDOM')
                                .setTitle('Reminder!')
                                .setDescription(`You set a reminder to ${reminder}`)
                                .setFooter({ text: 'Dose responsibly!', iconURL: ts_icon_url });
                            user.send({ embeds: [reminder_embed] });
                            // remove the reminder
                            // delete doc.data().reminders[remindertime];
                            delete all_reminders[remindertime];
                            db.collection(users_db_name).doc(user_fb_id).update({
                                reminders: all_reminders,
                            });
                            global.user_db = await db.collection(users_db_name).get();
                        }
                    }
                }

            });
        }
        checkReminders();
        setInterval(checkReminders, 60000);

        // async function backup_db() {
        //     const users_db = await global.firebase_db.collection('users').get();
        //     users_db.forEach((doc) => {
        //         const id = doc.id;
        //         const data = doc.data();
        //         global.firebase_db.collection('users_dev').doc(id).set(data);
        //     });

        //     const guilds_db = await global.firebase_db.collection('guilds').get();
        //     guilds_db.forEach((doc) => {
        //         const id = doc.id;
        //         const data = doc.data();
        //         global.firebase_db.collection('guilds_dev').doc(id).set(data);
        //     });
        // }
        // backup_db();

        logger.info(`[${PREFIX}] Ready to take over the world!`);
    },
};