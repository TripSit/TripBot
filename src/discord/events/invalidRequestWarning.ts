import {
  TextChannel,
} from 'discord.js';
import {invalidRequestWarningEvent} from '../@types/eventDef';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const invalidRequestWarning: invalidRequestWarningEvent = {
  name: 'invalidRequestWarning',
  async execute(invalidRequestWarningData) {
    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    const response = `Invalid request warning count: ${invalidRequestWarningData.count} Time left: ${invalidRequestWarningData.remainingTime})`; // eslint-disable-line max-len
    botlog.send(response);
    log.error(`[${PREFIX}] ${response}`);
  },
};
