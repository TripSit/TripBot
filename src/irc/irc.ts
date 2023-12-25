import { Client } from 'matrix-org-irc';
import registerEvents from './utils/registerEvents';

const F = f(__filename);

export default async function ircConnect(): Promise<void> {
  log.info(F, 'started!');
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

  const ircConfig = {
    "userName": env.IRC_USERNAME,
    "realName": "TripSit Mod Relay",
    "password": env.IRC_PASSWORD,
    "port": 6667,
    "channels": ircChannels,
    "autoConnect": true,
    "autoRejoin": true,
    "autoRenick": true,
    "renickDelay": 60000,
    "retryDelay": 2000,
    "secure": false,
    "selfSigned": true,
    "certExpired": true,
    "floodProtection": false,
    "sasl": true,
    "stripColors": false,
    "channelPrefixes": "#",
    "messageSplit": 512,
    "encoding": "UTF-8",
    "debug": false,
    "log": false
  }
  

  global.ircClient = new Client(env.IRC_SERVER, env.IRC_USERNAME, ircConfig);
  registerEvents();
}
