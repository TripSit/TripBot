// import * as path from 'path';
import {
  TextChannel,
} from 'discord.js';
import {
  DebugEvent,
} from '../@types/eventDef';
import env from '../../global/utils/env.config';
// import log from '../../global/utils/log';

// const PREFIX = path.parse(__filename).name;

const enable = false;

export default debug;

export const debug: DebugEvent = {
  name: 'debug',
  async execute(info) {
    if (!enable) return;
    // log.debug(`[${PREFIX}] info: ${info}`);
    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    await botlog.send(info);
  },
};
