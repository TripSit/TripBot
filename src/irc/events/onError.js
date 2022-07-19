'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

module.exports = {
  async execute() {
    global.ircClient.addListener('error', message => {
      // It always seems to show this error first before actually working
      // The second error happens doing whois on a user
      if (message.args) {
        if (message.args[1] !== 'You have not registered'
        && message.args[2] !== 'No such nick/channel'
        && message.args[2].indexOf('is using a secure connection') === -1) {
          if (message.args[2] === 'You\'re not a channel operator') {
            global.ircClient.say(message.args[1], `Error: I am not an operator in ${message.args[1]}`);
            logger.error(`[${PREFIX}] I am not an operator in ${message.args[1]}`);
          } else {
            global.ircClient.say(message.args[1], `Error: ${JSON.stringify(message.args, null, 2).replace(/\n|\r/g, '')}`);
            logger.error(`[${PREFIX}] ${JSON.stringify(message, null, 2).replace(/\n|\r/g, '')}`);
          }
        }
      } else {
        logger.error(`[${PREFIX}] Error:`);
        logger.error(message);
      }
    });
  },
};
