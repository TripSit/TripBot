import {
  debugEvent,
} from '../@types/eventDef';
import log from '../../global/utils/log';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

const enable = false;

export const debug: debugEvent = {
  name: 'debug',
  async execute(info) {
    if (!enable) return;
    log.debug(`[${PREFIX}] info: ${info}`);
    // const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    // botlog.send(info);
  },
};
