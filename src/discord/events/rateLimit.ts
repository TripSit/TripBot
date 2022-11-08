import {
  TextChannel,
} from 'discord.js';
import {rateLimitEvent} from '../@types/eventDef';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const rateLimit: rateLimitEvent = {
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
