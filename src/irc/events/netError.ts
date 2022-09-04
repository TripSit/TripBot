import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

module.exports = {
  async execute() {
    global.ircClient.addListener('netError', (exception:any) => {
      logger.error(exception);
      logger.error(`[${PREFIX}] ${JSON.stringify(exception, null, 2)}`);
    });
  },
};
