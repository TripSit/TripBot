const fs = require('node:fs');
const PREFIX = require('path').parse(__filename).name;

module.exports = {
    name: 'ready',
    once: true,
    execute(client, logger) {
        const db_name = 'ts_data.json';
        const raw_ts_data = fs.readFileSync(`./src/data/${db_name}`);
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
        logger.info(`[${PREFIX}] Ready to take over the world!`);
    },
};