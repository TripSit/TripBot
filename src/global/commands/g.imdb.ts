import env from '../utils/env.config';
import * as imdbApi from 'imdb-api';
// import logger from '../utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

/**
 *
 * @param {string} title
 * @return {any}
 */
export async function imdb(title:string):Promise<imdbApi.Movie> {
  return await imdbApi.get({name: title}, {apiKey: env.IMDB_TOKEN, timeout: 30000});
};
