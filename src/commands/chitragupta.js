const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const { get_user_info } = require('../utils/get_user_info');
const { set_user_info } = require('../utils/set_user_info');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chitragupta')
        .setDescription('Keep it positive please!'),

    async execute(interaction, actor, action, emoji, target) {
        logger.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

        if (actor === target) {return;}
        // Extract actor data
        const actor_results = await get_user_info(actor);
        const actor_data = actor_results[0];

        // Transform actor data
        if ('karma_given' in actor_data) {
            logger.debug(`[${PREFIX}] Updating karma_given info!`);
            actor_data.karma_given[emoji] = (actor_data.karma_given[emoji] || 0) + action;
        }
        else {
            logger.debug(`[${PREFIX}] Creating karma_given info!`);
            actor_data.karma_given = { [emoji]: action };
        }

        // Load actor data
        await set_user_info(actor_results[1], actor_data);

        // Extract target data
        const target_results = await get_user_info(target);
        const target_data = target_results[0];

        // Transform target data
        if ('karma_recieved' in target_data) {
            logger.debug(`[${PREFIX}] Updating karma_recieved info!`);
            target_data.karma_recieved[emoji] = (target_data.karma_recieved[emoji] || 0) + action;
        }
        else {
            logger.debug(`[${PREFIX}] Creating karma_given info!`);
            target_data.karma_recieved = { [emoji]: action };
        }

        // Load target data
        await set_user_info(target_results[1], target_data);

        return logger.debug(`[${PREFIX}] finished!`);
    },
};
