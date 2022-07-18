'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

module.exports = {
  async execute() {
    global.ircClient.addListener('error', message => {
      // It always seems to show this error first before actually working
      // The second error happens doing whois on a user
      if (message.args) {
        if (message.args[1] !== 'You have not registered' && message.args[2] !== 'No such nick/channel') {
          logger.error(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
        }
      } else {
        logger.error(`[${PREFIX}] Error:`);
        logger.error(message);
      }
    });
  },
};
