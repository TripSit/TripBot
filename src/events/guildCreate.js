const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
const { get_guild_info } = require('../utils/get_user_info');
const { set_guild_info } = require('../utils/set_user_info');

module.exports = {
    name: 'guildCreate',
    async execute(guild) {
        logger.info(`[${PREFIX}] Joined guild: ${guild.name} (id: ${guild.id})`);


        // Extract taget data
        const target_results = await get_guild_info(guild);
        const target_data = target_results[0];

        if (target_data.guild_banned == true) {
            logger.info(`[${PREFIX}] I'm banned from ${guild.name}, leaving!`);
            guild.leave();
            return;
        }

        // Load target data
        await set_guild_info(target_results[1], target_data);
    },
};