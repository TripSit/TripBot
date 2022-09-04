import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

module.exports = {
  async execute() {
    global.ircClient.addListener('unhandled', (message:any) => {
      if (message.args[2].indexOf('is using a secure connection') === -1) {
        logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      }
    });
  },
};
