import {
  TextChannel,
} from 'discord.js';
import { WarnEvent } from '../@types/eventDef';

const F = f(__filename);

export const warn: WarnEvent = {
  name: 'warn',
  async execute(info) {
    const botlog = await discordClient.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    await botlog.send(info);
    log.error(F, `${info}`);
  },
};

export default warn;
