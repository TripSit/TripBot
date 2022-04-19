const fs = require('node:fs');
const PREFIX = require('path').parse(__filename).name;
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const PORT = process.env.PORT;

module.exports = {
    name: 'ready',
    once: true,
    execute(client, logger) {
        const db_name = 'ts_data.json';
        const raw_ts_data = fs.readFileSync(`./src/assets/${db_name}`);
        const ts_data = JSON.parse(raw_ts_data);
        const blacklist_guilds = ts_data.blacklist.guilds;

        // logger.debug(`[${PREFIX}] blacklist_guilds: ${blacklist_guilds}`);
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
            logger.info(`[${PREFIX}] Example app listening on port ${PORT}`);
        });

        logger.info(`[${PREFIX}] Ready to take over the world!`);
    },
};