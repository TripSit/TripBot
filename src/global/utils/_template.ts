import {
  Client,
} from 'discord.js';
// import env from './env.config';
// import {embedTemplate} from '../../discord/utils/embedTemplate';
// import {stripIndents} from 'common-tags';
import { parse } from 'path';
import log from './log';

const PREFIX = parse(__filename).name;

export default template;

/**
 * Template
 * @param {Client} client Template
 */
export async function template(client:Client) {
  log.debug(`[${PREFIX}] Initialized!`);
  log.debug(`[${PREFIX}] client: ${JSON.stringify(client, null, 2)}`);
}
