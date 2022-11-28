import {
  TextChannel,
} from 'discord.js';
import { parse } from 'path';
import { WarnEvent } from '../@types/eventDef';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';

const PREFIX = parse(__filename).name;

export default warn;

export const warn: WarnEvent = {
  name: 'warn',
  async execute(info) {
    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    botlog.send(info);
    log.error(`[${PREFIX}] ${info}`);
  },
};
