import {
  TextChannel,
} from 'discord.js';
import { InvalidRequestWarningEvent } from '../@types/eventDef';

const F = f(__filename);

export const invalidRequestWarning: InvalidRequestWarningEvent = {
  name: 'invalidRequestWarning',
  async execute(invalidRequestWarningData) {
    const botlog = await discordClient.channels.fetch(env.CHANNEL_BOTERRORS) as TextChannel;
    const response = `Invalid request warning count: ${invalidRequestWarningData.count} Time left: ${invalidRequestWarningData.remainingTime})`; // eslint-disable-line max-len
    await botlog.send(response);
    log.error(F, `${response}`);
  },
};

export default invalidRequestWarning;
