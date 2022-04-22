const PREFIX = require('path').parse(__filename).name;
const { getFirestore } = require('firebase-admin/firestore');
const logger = require('../utils/logger.js');

module.exports = {
    name: 'guildCreate',
    async execute(guild) {
        logger.info(`[${PREFIX}] Joined guild: ${guild.name} (id: ${guild.id})`);

        const db = getFirestore();
        const snapshot = await db.collection('guilds').get();
        snapshot.forEach((doc) => {
            // logger.debug(`[${PREFIX}] ${doc.id}, '=>', ${doc.data()}`);
            if (doc.data().guild_id == guild.id) {
                if (doc.data().guild_banned == true) {
                    logger.info(`[${PREFIX}] I'm banned from ${guild.name}, leaving!`);
                    guild.leave();
                    return;
                }
            }
        });
        const targetData = {
            guild_name: guild.name,
            guild_id: guild.id,
            guild_created: guild.createdAt,
            guild_joined: guild.joinedAt,
            guild_description: `${guild.description ? guild.description : 'No description'}`,
            guild_member_count: guild.memberCount,
            guild_owner_id: guild.ownerId,
            guild_owner_name: guild.username,
            guild_icon: guild.iconURL(),
            guild_banned: false,
        };

        await db.collection('guilds').doc().set(targetData);
    },
};