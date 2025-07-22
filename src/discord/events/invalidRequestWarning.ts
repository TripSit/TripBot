import type { TextChannel } from 'discord.js';

import type { InvalidRequestWarningEvent } from '../@types/eventDef';

const F = f(__filename);

export const invalidRequestWarning: InvalidRequestWarningEvent = {
  async execute(invalidRequestWarningData) {
    const botlog = (await discordClient.channels.fetch(env.CHANNEL_BOTERRORS)) as TextChannel;
    const response = `Invalid request warning count: ${invalidRequestWarningData.count} Time left: ${invalidRequestWarningData.remainingTime})`;
    await botlog.send(response);
    log.error(F, response);
  },
  name: 'invalidRequestWarning',
};

export default invalidRequestWarning;
