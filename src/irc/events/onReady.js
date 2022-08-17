'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

module.exports = {
  name: 'onReady',
  async execute() {
    global.ircClient.addListener('registered', () => {
      logger.info(`[${PREFIX}] IRC bot initialized: ready to party like it's 2001!`);
    });
  },
};
