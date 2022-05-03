const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const db = global.db;
const guild_db_name = process.env.guild_db_name;
const users_db_name = process.env.users_db_name;

module.exports = {
    set_user_info: async (fbid, data) => {
        logger.debug(`[${PREFIX}] Saving ${fbid}!`);

        if (fbid !== '') {
            logger.debug(`[${PREFIX}] Updating actor data`);
            try {
                await db.collection(users_db_name).doc(fbid).set(data);
            }
            catch (err) {
                logger.error(`[${PREFIX}] Error updating actor data: ${err}`);
            }
        }
        else {
            logger.debug(`[${PREFIX}] Creating actor data`);
            try {
                await db.collection(users_db_name).doc().set(data);
            }
            catch (err) {
                logger.error(`[${PREFIX}] Error creating actor data: ${err}`);
            }
        }
        return;
    },
    set_guild_info: async (fbid, data) => {
        logger.debug(`[${PREFIX}] Saving ${fbid}!`);

        if (fbid !== '') {
            logger.debug(`[${PREFIX}] Updating actor data`);
            try {
                await db.collection(guild_db_name).doc(fbid).set(data);
            }
            catch (err) {
                logger.error(`[${PREFIX}] Error updating actor data: ${err}`);
            }
        }
        else {
            logger.debug(`[${PREFIX}] Creating actor data`);
            try {
                await db.collection(guild_db_name).doc().set(data);
            }
            catch (err) {
                logger.error(`[${PREFIX}] Error creating actor data: ${err}`);
            }
        }
        return;
    },
};
