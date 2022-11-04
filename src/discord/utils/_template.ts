import {
  Client,
} from 'discord.js';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 * Template
 * @param {Client} client The Client that manages this interaction
 * @return {Promise<void>}
**/
export async function bestOf(client: Client): Promise<void> {
  log.debug(`[${PREFIX}] starting!`);
  log.debug(`[${PREFIX}] guildId: ${env.DISCORD_GUILD_ID}`);
};
