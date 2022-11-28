import * as imdbApi from 'imdb-api';
import { parse } from 'path';
import env from '../utils/env.config';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default imdb;

/**
 *
 * @param {string} title
 * @return {any}
 */
export async function imdb(title:string):Promise<imdbApi.Movie> {
  const response = await imdbApi.get({ name: title }, { apiKey: env.IMDB_TOKEN, timeout: 30000 });
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
