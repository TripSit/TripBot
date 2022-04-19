const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');

module.exports = {
    name: 'disconnect',
    execute(evt) {
        logger.warn(`[${PREFIX}] Disconnected: ${evt.reason} (${evt.code})`);
    },
};