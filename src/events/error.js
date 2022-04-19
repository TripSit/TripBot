const PREFIX = require('path').parse(__filename).name;

module.exports = {
    name: 'error',
    execute(err, logger) {
        logger.error(`[${PREFIX}] Client error: ${err.message}`);
    },
};