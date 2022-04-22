const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
const { getFirestore } = require('firebase-admin/firestore');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

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

        logger.info(`[${PREFIX}] Ready to take over the world!`);
    },
};