import {
  TextChannel,
} from 'discord.js';
import { parse } from 'path';
import { RateLimitEvent } from '../@types/eventDef';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';

const PREFIX = parse(__filename).name;

export default rateLimit;

export const rateLimit: RateLimitEvent = {
  name: 'rateLimit',
  async execute(rateLimitData) {
    const response = `Rate limit warning!
    Global: ${rateLimitData.global}
    Hash: ${rateLimitData.hash}
    Limit: ${rateLimitData.limit}
    MajorParameter: ${rateLimitData.majorParameter}
    Method: ${rateLimitData.method}
    Route: ${rateLimitData.route}
    TimeToReset: ${rateLimitData.timeToReset}
    URL: ${rateLimitData.url}
    `;

    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    botlog.send(response);
    log.error(`[${PREFIX}] ${response}`);
  },
};
