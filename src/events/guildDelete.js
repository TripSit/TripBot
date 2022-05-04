const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger');

module.exports = {
  name: 'guildDelete',
  async execute(guild) {
    logger.info(`[${PREFIX}] Left guild: ${guild.name} (id: ${guild.id})`);
  },
};
