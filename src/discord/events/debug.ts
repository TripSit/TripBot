// import * as path from 'path';
import {
  TextChannel,
} from 'discord.js';
import {
  DebugEvent,
} from '../@types/eventDef';
// import log from '../../global/utils/log';

// const F= f(__filename);

const enable = false;

export default debug;

export const debug: DebugEvent = {
  name: 'debug',
  async execute(info) {
    if (!enable) return;
    // log.debug(F, `info: ${info}`);
    const botlog = await client.channels.fetch(env.CHANNEL_BOTERRORS) as TextChannel;
    await botlog.send(info);
  },
};
