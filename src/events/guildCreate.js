const PREFIX = require('path').parse(__filename).name;
const db = global.db;
const logger = require('../utils/logger.js');
const guild_db_name = process.env.guild_db_name;
module.exports = {
    name: 'guildCreate',
    async execute(guild) {
        logger.info(`[${PREFIX}] Joined guild: ${guild.name} (id: ${guild.id})`);

        const snapshot = global.guild_db;
        snapshot.forEach((doc) => {
            // logger.debug(`[${PREFIX}] ${doc.id}, '=>', ${doc.value}`);
            if (doc.value.guild_id == guild.id) {
                if (doc.value.guild_banned == true) {
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
        try {
            await db.collection(guild_db_name).doc(guild.id).set(targetData);
        }
        catch (err) {
            logger.error(`[${PREFIX}] Error adding guild data to firebase: ${err}`);
        }
    },
};