import {
  Client,
} from 'discord.js';
// import env from './env.config';
// import {embedTemplate} from '../../discord/utils/embedTemplate';
// import {stripIndents} from 'common-tags';
import logger from './logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 * Template
 * @param {Client} client Template
 */
export async function template(client:Client) {
  logger.debug(`[${PREFIX}] Starting`);
  logger.debug(`[${PREFIX}] Finished`);
};
