import env from '../global/utils/env.config';
import logger from '../global/utils/logger';
import * as irc from 'matrix-org-irc';
import ircConfig from './assets/config/irc_config.json';
import {registerEvents} from './utils/registerEvents';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 *
 * @return {Promise<void>}
 */
export async function ircConnect(): Promise<void> {
  logger.info(`[${PREFIX}] started!`);
  // If there is no password provided, dont even try to connect
  if (!env.IRC_PASSWORD) {
    return;
  }

  let ircChannels = [];
  if (env.NODE_ENV === 'production') {
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

  ircConfig.userName = env.IRC_USERNAME;
  ircConfig.password = env.IRC_PASSWORD;
  ircConfig.channels = ircChannels;

  global.ircClient = new irc.Client(env.IRC_SERVER, env.IRC_USERNAME, ircConfig);
  registerEvents();
};
