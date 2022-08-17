'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require("../../global/utils/logger");

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
  { type: 'PLAYING', message: 'with a test kit' },
  { type: 'WATCHING', message: 'out for impure drugs' },
  { type: 'LISTENING', message: 'to someone\'s problem' },
];

module.exports = {
  name: 'ready',
  once: true,
  async startStatusLoop(client) {
    logger.debug(`[${PREFIX}] Starting status loop...`);
    let state = 0;
    setInterval(() => {
      state = (state + 1) % activities.length;
      const presence = activities[state];
      client.user.setActivity(presence.message, { type: presence.type });
    }, 5 * 60 * 1000);
  },
};
