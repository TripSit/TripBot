'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger');

module.exports = {
  name: 'inviteDelete',

  async execute(invite) {
    logger.info(`[${PREFIX}] Invite deleted:`, invite);
  },
};
