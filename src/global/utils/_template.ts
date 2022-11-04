import {
  Client,
} from 'discord.js';
// import env from './env.config';
// import {embedTemplate} from '../../discord/utils/embedTemplate';
// import {stripIndents} from 'common-tags';
import log from './log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 * Template
 * @param {Client} client Template
 */
export async function template(client:Client) {
  log.debug(`[${PREFIX}] Starting`);
  log.debug(`[${PREFIX}] Finished`);
};
