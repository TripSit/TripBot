import type { TextChannel } from 'discord.js';

import type { WarnEvent } from '../@types/eventDef';

const F = f(__filename);

export const warn: WarnEvent = {
  async execute(info) {
    const botlog = (await discordClient.channels.fetch(env.CHANNEL_BOTLOG)) as TextChannel;
    await botlog.send(info);
    log.error(F, info);
  },
  name: 'warn',
};

export default warn;
