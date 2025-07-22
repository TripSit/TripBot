import type { TextChannel } from 'discord.js';

import type { RateLimitEvent } from '../@types/eventDef';

const F = f(__filename);

export const rateLimit: RateLimitEvent = {
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

    const botlog = (await discordClient.channels.fetch(env.CHANNEL_BOTERRORS)) as TextChannel;
    await botlog.send(response);
    log.error(F, response);
  },
  name: 'rateLimit',
};

export default rateLimit;
