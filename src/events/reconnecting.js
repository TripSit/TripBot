const PREFIX = require('path').parse(__filename).name;

module.exports = {
    name: 'reconnecting',
    execute(client, logger) {
        logger.info(`[${PREFIX}] Reconnecting...`);
    },
};