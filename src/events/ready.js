const fs = require('node:fs');
const PREFIX = require('path').parse(__filename).name;
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const { getFirestore } = require('firebase-admin/firestore');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const ts_icon_url = process.env.ts_icon_url;
const PORT = process.env.PORT;

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        const db = getFirestore();

        const snapshot = await db.collection('guilds').get();
        const blacklist_guilds = [];
        snapshot.forEach((doc) => {
            // logger.debug(`[${PREFIX}] ${doc.id}, '=>', ${doc.data()}`);
            if (doc.data().isBanned == true) {
                blacklist_guilds.push(doc.data().guild_id);
            }
        });

        logger.debug(`[${PREFIX}] blacklist_guilds: ${blacklist_guilds}`);
        // for each guild in client.guilds, print the guild name
        logger.debug(`[${PREFIX}] I am in:`);
        client.guilds.cache.forEach(guild => {
            logger.debug(`[${PREFIX}] ${guild.name}`);
        });

        // Check if the guild is in blacklist_guilds and if so, leave it
        client.guilds.cache.forEach(guild => {
            if (blacklist_guilds.includes(guild.id)) {
                logger.info(`[${PREFIX}] Leaving ${guild.name}`);
                guild.leave();
            }
        });

        const express = require('express');
        const app = express();

        app.get('/', (req, res) => {
            // res.send('Hello World!');
            res.status(200).send('Ok');
        });

        app.listen(PORT, () => {
            logger.debug(`[${PREFIX}] Healthcheck app listening on port ${PORT}`);
        });

        async function checkReminders() {
            const reminder_cache = JSON.parse(fs.readFileSync('./src/assets/reminders.json'));
            // For the keys in reminder_cache, check if the actor is in the key
            for (const userid in reminder_cache) {
                // logger.debug(`[${PREFIX}] userid: ${userid}`);
                // logger.debug(`[${PREFIX}] reminder_cache['${userid}']: ${JSON.stringify(reminder_cache[`${userid}`], null, 2)}`);
                // logger.debug(`[${PREFIX}] reminders: ${JSON.stringify(reminder_cache[`${userid}`]['reminders'], null, 2)}`);
                if (Object.keys(reminder_cache[`${userid}`]['reminders']).length > 0) {
                    for (const remindertime in reminder_cache[userid]['reminders']) {
                        // logger.debug(`[${PREFIX}] remindertime: ${remindertime}`);
                        // logger.debug(`[${PREFIX}] now: ${Date.now() / 1000}`);
                        if (remindertime <= Date.now() / 1000) {
                            logger.debug(`[${PREFIX}] Sending reminder to ${userid}`);
                            const reminder = reminder_cache[userid]['reminders'][remindertime];
                            logger.debug(`[${PREFIX}] reminder: ${reminder}`);
                            const user = await client.users.fetch(userid);
                            logger.debug(`[${PREFIX}] user: ${user.id}`);
                            const reminder_embed = new MessageEmbed()
                                .setColor('RANDOM')
                                .setTitle('Reminder!')
                                .setDescription(`You set a reminder to ${reminder}`)
                                .setFooter({ text: 'Dose responsibly!', iconURL: ts_icon_url });
                            user.send({ embeds: [reminder_embed] });
                            logger.debug(`[${PREFIX}] user: ${user.id}`);
                            delete reminder_cache[userid]['reminders'][remindertime];
                            fs.writeFileSync('./src/assets/reminders.json', JSON.stringify(reminder_cache, null, 2));
                        }
                    }
                }
            }
        }
        checkReminders();
        setInterval(checkReminders, 60000);

        logger.info(`[${PREFIX}] Ready to take over the world!`);
    },
};