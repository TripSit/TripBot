const PREFIX = require('path').parse(__filename).name;

module.exports = {
    name: 'disconnect',
    execute(evt, logger) {
        logger.info(`[${PREFIX}] Disconnected: ${evt.reason} (${evt.code})`);
    },
};