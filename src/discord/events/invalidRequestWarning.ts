import {
  TextChannel,
} from 'discord.js';
import { parse } from 'path';
import { InvalidRequestWarningEvent } from '../@types/eventDef';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';

const PREFIX = parse(__filename).name;

export default invalidRequestWarning;

export const invalidRequestWarning: InvalidRequestWarningEvent = {
  name: 'invalidRequestWarning',
  async execute(invalidRequestWarningData) {
    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    const response = `Invalid request warning count: ${invalidRequestWarningData.count} Time left: ${invalidRequestWarningData.remainingTime})`; // eslint-disable-line max-len
    await botlog.send(response);
    log.error(`[${PREFIX}] ${response}`);
  },
};
