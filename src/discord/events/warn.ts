import {
  TextChannel,
} from 'discord.js';
import { WarnEvent } from '../@types/eventDef';

const F = f(__filename);

export default warn;

export const warn: WarnEvent = {
  name: 'warn',
  async execute(info) {
    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    await botlog.send(info);
    log.error(F, `${info}`);
  },
};
