import env from '../utils/env.config';
import * as imdbApi from 'imdb-api';
import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 *
 * @param {string} title
 * @return {any}
 */
export async function imdb(title:string):Promise<imdbApi.Movie> {
  const response = await imdbApi.get({name: title}, {apiKey: env.IMDB_TOKEN, timeout: 30000});
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
};
