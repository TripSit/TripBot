'use strict';

const path = require('path');
const irc = require('irc-upd');
const logger = require('../global/utils/logger');
const ircConfig = require('./assets/config/irc_config.json');
const registerEvents = require('./utils/registerEvents');

const PREFIX = path.parse(__filename).name;

const {
  NODE_ENV,
  ircServer,
  ircUsername,
  ircPassword,
} = require('../../env');

module.exports = {
  async ircConnect() {
    logger.info(`[${PREFIX}] started!`);
    // If there is no password provided, dont even try to connect
    if (!ircPassword) { return; }

    let ircChannels = [];
    if (NODE_ENV === 'production') {
      ircChannels = [
        '#sanctuary',
        '#tripsit',
        '#tripsit1',
        '#tripsit2',
        '#tripsit3',
        '#tripsit-dev',
        '#content',
        '#sandbox',
        '#lounge',
        '#opiates',
        '#stims',
        '#depressants',
        '#dissociatives',
        '#psychedelics',
        '#moderators',
        '#meeting-room',
        '#teamtripsit',
        '#operations',
        '#modhaven',
        '#tripsit.me',
      ];
    } else {
      ircChannels = [
        '#sandbox-dev',
      ];
    }

    ircConfig.userName = ircUsername;
    ircConfig.password = ircPassword;
    ircConfig.channels = ircChannels;

    // logger.debug(`[${PREFIX}] ircConfig: ${JSON.stringify(ircConfig, null, 2)}`);
    global.ircClient = new irc.Client(ircServer, ircUsername, ircConfig);
    registerEvents();
  },
};
