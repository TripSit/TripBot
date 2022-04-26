const PREFIX = require('path').parse(__filename).name;
const { getFirestore } = require('firebase-admin/firestore');
const logger = require('../utils/logger.js');
const guild_id = process.env.guildId;

module.exports = {
    name: 'guildMemberAdd',
    async execute(guild) {
        logger.info(`[${PREFIX}] Joined guild: ${guild.name} (id: ${guild.id})`);
        if (guild.id === guild_id) {
            console.log('test');
        }
    },
};
