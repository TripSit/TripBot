const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');

module.exports = {
    name: 'error',
    execute(err) {
        logger.error(`[${PREFIX}] Client error: ${err.message}`);
    },
};