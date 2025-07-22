// import * as path from 'path';
import type { TextChannel } from 'discord.js';

import type { DebugEvent } from '../@types/eventDef';
// import log from '../../global/utils/log';

// const F= f(__filename);

const enable = false;

export const debug: DebugEvent = {
  async execute(info) {
    if (!enable) {
      return;
    }
    // log.debug(F, `info: ${info}`);
    const botlog = (await discordClient.channels.fetch(env.CHANNEL_BOTLOG)) as TextChannel;
    await botlog.send(info);
  },
  name: 'debug',
};

export default debug;
