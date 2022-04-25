const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');

module.exports = {
    name: 'guildDelete',
    async execute(guild) {
        logger.info(`[${PREFIX}] Left guild: ${guild.name} (id: ${guild.id})`);
        // const db = getFirestore();
        // const snapshot = await db.collection('guilds').get();
        // snapshot.forEach((doc) => {
        //     // logger.debug(`[${PREFIX}] ${doc.id}, '=>', ${doc.data()}`);
        //     if (doc.data().guild_id == guild.id) {
        //         doc.delete();
        //         return;
        //     }
        // });
    },
};