'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');
const { linkAccounts } = require('../utils/link-accounts');

module.exports = {
  name: 'onReady',
  async execute() {
    global.ircClient.addListener('pm', async (from, message) => {
      logger.debug(`[${PREFIX}] PM from ${from}: ${message}`);

      // If the message matches the format of a token
      const token = message.match(/\S{6}-\S{6}-\S{6}/);
      if (token !== null) {
        linkAccounts(from, token);
      }
    });
  },
};
