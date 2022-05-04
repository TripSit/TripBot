const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const db = global.db;
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const users_db_name = process.env.users_db_name;
const { get_user_info } = require('../../utils/get_user_info');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chitragupta')
        .setDescription('Keep it positive please!'),

    async execute(interaction, actor, action, emoji, target) {
        logger.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

        if (actor === target) {return;}
        // logger.debug(`[${PREFIX}] actor.id: ${actor.id}`);
        const actor_results = get_user_info(actor);
        const actor_data = actor_results[0];
        const actor_fbid = actor_results[1];

        if ('karma_given' in actor_data) {
            logger.debug(`[${PREFIX}] Updating karma_given info!`);
            actor_data.karma_given[emoji] = (actor_data.karma_given[emoji] || 0) + action;
        }
        else {
            logger.debug(`[${PREFIX}] Creating karma_given info!`);
            actor_data.karma_given = { [emoji]: action };
        }

        if (actor_fbid !== '') {
            logger.debug(`[${PREFIX}] Updating actor data in firebase`);
            try {
                await db.collection(users_db_name).doc(actor_fbid).set(actor_data);
            }
            catch (err) {
                logger.error(`[${PREFIX}] Error updating actor data in firebase: ${err}`);
            }
        }
        else {
            logger.debug(`[${PREFIX}] Creating actor data in firebase`);
            try {
                await db.collection(users_db_name).doc().set(actor_data);
            }
            catch (err) {
                logger.error(`[${PREFIX}] Error creating actor data in firebase: ${err}`);
            }
        }

        const target_results = get_user_info(target);
        const target_data = target_results[0];
        const target_fbid = target_results[1];
        if ('karma_recieved' in target_data) {
            logger.debug(`[${PREFIX}] Updating karma_recieved info!`);
            target_data.karma_recieved[emoji] = (target_data.karma_recieved[emoji] || 0) + action;
        }
        else {
            logger.debug(`[${PREFIX}] Creating karma_given info!`);
            target_data.karma_recieved = { [emoji]: action };
        }

        if (target_fbid !== '') {
            logger.debug(`[${PREFIX}] Updating target data in firebase`);
            try {
                await db.collection(users_db_name).doc(target_fbid).set(target_data);
            }
            catch (err) {
                logger.error(`[${PREFIX}] Error updating target data in firebase: ${err}`);
            }
        }
        else {
            logger.debug(`[${PREFIX}] Creating target data in firebase`);
            try {
                await db.collection(users_db_name).doc().set(target_data);
            }
            catch (err) {
                logger.error(`[${PREFIX}] Error creating target data in firebase: ${err}`);
            }
        }
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
