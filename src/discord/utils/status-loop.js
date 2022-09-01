'use strict';

const PREFIX = require('path').parse(__filename).name;
const { ActivityType } = require('discord.js');
const logger = require('../../global/utils/logger');

const {
  NODE_ENV,
} = require('../../../env');

// https://discord.js.org/#/docs/discord.js/stable/typedef/ActivityType
// https://discord.com/developers/docs/game-sdk/activities#data-models-activitytype-enum
// https://discord.com/developers/docs/topics/gateway#activity-object-activity-types

// Activity options consist of:
// ID - Name      - Format
// 0  - PLAYING   - Playing {message}
// Type cannot be blank or else it will default to 0 (PLAYING)
// 1  - STREAMING - Streaming {message}
// The streaming type currently only supports Twitch and YouTube URLS.
// 2  - LISTENING - Listening to {message}
// 3  - WATCHING  - Watching {message}
// 4  - CUSTOM    - {emoji} {message} (See note!)
// "Bots cannot set a CUSTOM activity type, it is only for custom statuses received from users"
// SO WHY IS IT AN OPION???
// 5  - COMPETING - Competing in {message}

const activities = [
  { type: ActivityType.Playing, message: 'with a scale' },
  { type: ActivityType.Watching, message: 'test kit results' },
  { type: ActivityType.Listening, message: 'someone talk' },
];

const delay = NODE_ENV === 'production' ? 5 * 60 * 1000 : 5 * 1000;

module.exports = {
  name: 'ready',
  once: true,
  async startStatusLoop(client) {
    logger.info(`[${PREFIX}] Starting status loop...`);

    let state = 0;
    let presence = activities[state];
    client.user.setActivity(presence.message, { type: presence.type });

    setInterval(() => {
      state = (state + 1) % activities.length;
      presence = activities[state];
      // logger.debug(`[${PREFIX}] Setting activity to ${presence.type} ${presence.message}`);
      client.user.setActivity(presence.message, { type: presence.type });
    }, delay);
  },
};
