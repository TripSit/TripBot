import {
  TextChannel,
} from 'discord.js';
import { InvalidRequestWarningEvent } from '../@types/eventDef';

const F = f(__filename);

export default invalidRequestWarning;

export const invalidRequestWarning: InvalidRequestWarningEvent = {
  name: 'invalidRequestWarning',
  async execute(invalidRequestWarningData) {
    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    const response = `Invalid request warning count: ${invalidRequestWarningData.count} Time left: ${invalidRequestWarningData.remainingTime})`; // eslint-disable-line max-len
    await botlog.send(response);
    log.error(F, `${response}`);
  },
};
