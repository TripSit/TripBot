const fs = require('node:fs');
const PREFIX = require('path').parse(__filename).name;

module.exports = {
    name: 'guildCreate',
    execute(client, logger, guild) {
        logger.info(`[${PREFIX}] Joined guild: ${guild.name} (id: ${guild.id})`);
        const db_name = 'ts_data.json';
        const raw_ts_data = fs.readFileSync(`./src/data/${db_name}`);
        const ts_data = JSON.parse(raw_ts_data);
        const blacklist_guilds = ts_data.blacklist.guilds;
        // Check if the guild is in blacklist_guilds and if so, leave it
        if (blacklist_guilds.includes(guild.id)) {
            logger.info(`[${PREFIX}] Leaving ${guild.name}`);
            guild.leave();
        }
    },
};