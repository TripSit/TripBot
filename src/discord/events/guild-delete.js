'use strict';

const path = require('path');
const logger = require('../../global/utils/logger');

const PREFIX = path.parse(__filename).name;

module.exports = {
  name: 'guildDelete',

  async execute(guild) {
    logger.info(`[${PREFIX}] Left guild: ${guild.name} (id: ${guild.id})`);
  },
};
