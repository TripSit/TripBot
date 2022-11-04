/* eslint-disable no-unused-vars */
import {Client} from 'discord.js';
import {
  clientEvent,
} from '../@types/eventDef';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const template: clientEvent = {
  name: 'template',
  once: false,
  async execute(client: Client) {
    log.debug(`[${PREFIX}] starting!`);
    log.debug(`[${PREFIX}] guildId: ${env.DISCORD_GUILD_ID}`);
    log.debug(`[${PREFIX}] finished!`);
  },
};
