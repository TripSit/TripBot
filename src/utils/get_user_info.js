const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');

module.exports = {
    get_user_info: (member) => {
        logger.debug(`[${PREFIX}] Looking up member ${member}!`);
        let member_data = null;
        let member_fbid = '';
        global.user_db.forEach((doc) => {
            if (doc.value.discord_id === member.id.toString()) {
                logger.debug(`[${PREFIX}] Member data found!`);
                member_data = doc.value;
                member_fbid = doc.key;
            }
        });
        if (!member_data) {
            logger.debug(`[${PREFIX}] No member data found, creating a blank one!`);
            member_data = {
                discord_username: member.user.username,
                discord_discriminator: member.user.discriminator,
                discord_id: member.id.toString(),
                karma_given: {},
                karma_received: {},
                mod_actions: {},
                roles: [],
                timezone: '',
            };
        }
        return [member_data, member_fbid];
    },
    get_guild_info: (guild) => {
        logger.debug(`[${PREFIX}] Looking up guild ${guild}!`);
        let guild_data = null;
        let guild_fbid = '';
        global.user_db.forEach((doc) => {
            if (doc.value.discord_id === guild.id.toString()) {
                guild_data = doc.value;
                guild_fbid = doc.key;
            }
        });

        if (!guild_data) {
            logger.debug(`[${PREFIX}] No target data found, creating a blank one`);
            guild_data = {
                guild_name: guild_data.name,
                guild_id: guild_data.id,
                guild_createdAt: guild_data.createdAt,
                guild_joinedAt: guild_data.joinedAt,
                guild_description: `${guild_data.description ? guild_data.description : 'No description'}`,
                guild_member_count: guild_data.memberCount,
                guild_owner_id: guild_data.ownerId,
                guild_icon: guild_data.iconURL(),
                guild_banned: false,
                guild_large: guild_data.large,
                guild_nsfw: guild_data.nsfwLevel,
                guild_partner: guild_data.partnered,
                guild_preferredLocale: `${guild_data.preferredLocale ? guild_data.preferredLocale : 'No Locale'}`,
                guild_region: `${guild_data.region ? guild_data.region : 'No region'}`,
                mod_actions: {},
            };
        }
        return [guild_data, guild_fbid];
    },
};
