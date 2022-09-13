import {
  Client,
} from 'discord.js';
import {
  ActivityType,
} from 'discord-api-types/v10';
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

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
  {message: 'with a scale', type: ActivityType.Playing},
  {message: 'test kit results', type: ActivityType.Watching},
  {message: 'someone talk', type: ActivityType.Listening},
];

const delay = env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 5 * 1000;

/**
 * This changes the status of the bot every 5 minutes
 * @param {Client} client The client running the bot
 */
export async function startStatusLoop(client:Client) {
  logger.info(`[${PREFIX}] Starting status loop...`);

  let state = 0;
  let presence = activities[state];
  // logger.debug(`[${PREFIX}] Setting presence to ${presence.message}`);
  // logger.debug(`[${PREFIX}] Setting presence type to ${presence.type}`);
  // @ts-ignore
  client.user?.setActivity(presence.message, {type: presence.type});

  setInterval(() => {
    state = (state + 1) % activities.length;
    presence = activities[state];
    // logger.debug(`[${PREFIX}] Setting activity to ${presence.type} ${presence.message}`);
    // @ts-ignore
    client.user?.setActivity(presence.message, {type: presence.type});
  }, delay);
};
