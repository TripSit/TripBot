const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
const guild_db_name = process.env.guild_db_name;

module.exports = {
    name: 'guildDelete',
    async execute(guild) {
        logger.info(`[${PREFIX}] Left guild: ${guild.name} (id: ${guild.id})`);
        // const db = getFirestore();
        // const snapshot = global.user_db;
        // snapshot.forEach((doc) => {
        //     // logger.debug(`[${PREFIX}] ${doc.id}, '=>', ${doc.value}`);
        //     if (doc.value.guild_id == guild.id) {
        //         doc.delete();
        //         return;
        //     }
        // });
    },
};