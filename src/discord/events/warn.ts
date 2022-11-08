import {
  TextChannel,
} from 'discord.js';
import {warnEvent} from '../@types/eventDef';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const warn: warnEvent = {
  name: 'warn',
  async execute(info) {
    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    botlog.send(info);
    log.error(`[${PREFIX}] ${info}`);
  },
};
