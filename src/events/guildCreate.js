const PREFIX = require('path').parse(__filename).name;

const { db } = global;
const logger = require('../utils/logger');
const { get_guild_info } = require('../utils/get-user-info');

if (process.env.NODE_ENV !== 'production') { require('dotenv').config(); }
const { guild_db_name } = process.env;

module.exports = {
  name: 'guildCreate',
  async execute(guild) {
    logger.info(`[${PREFIX}] Joined guild: ${guild.name} (id: ${guild.id})`);

    const target_rslt = get_guild_info(guild);
    const target_data = target_rslt[0];
    const target_fbid = target_rslt[1];

    if (target_data.guild_banned == true) {
      logger.info(`[${PREFIX}] I'm banned from ${guild.name}, leaving!`);
      guild.leave();
      return;
    }

    try {
      await db.collection(guild_db_name).doc(target_fbid).set(target_data);
    } catch (err) {
      logger.error(`[${PREFIX}] Error adding guild data to firebase: ${err}`);
    }
  },
};
