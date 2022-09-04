import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

/**
 *
 * @return {Promise<void>}
 */
module.exports = {
  async execute() {
    global.ircClient.addListener('action', (/* from, to, text, message */) => {
      logger.debug(`[${PREFIX}] starting!`);
    // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
    // {
    //   "prefix": "phusion!~phusion@tripsit/moderator/phusion",
    //   "nick": "phusion",
    //   "user": "~phusion",
    //   "host": "tripsit/moderator/phusion",
    //   "command": "PRIVMSG",
    //   "rawCommand": "PRIVMSG",
    //   "commandType": "normal",
    //   "args": [
    //     "#opiates",
    //     "\u0001ACTION flexes\u0001
    //   ]
    // }
    });
  },
};
