import {
  Client,
} from 'discord.js';
import { parse } from 'path';
import env from '../../global/utils/env.config';
import log from '../../global/utils/log';

const PREFIX = parse(__filename).name;

export default template;

/**
 * Template
 * @param {Client} client The Client that manages this interaction
 * @return {Promise<void>}
* */
export async function template(client: Client): Promise<void> {
  log.debug(`[${PREFIX}] guildId: ${env.DISCORD_GUILD_ID}`);
  log.debug(`[${PREFIX}] client: ${client}`);
}
