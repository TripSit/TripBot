import * as imdbApi from 'imdb-api';

const F = f(__filename);

export default imdb;

/**
 *
 * @param {string} title
 * @return {any}
 */
export async function imdb(title:string):Promise<imdbApi.Movie> {
  const response = await imdbApi.get({ name: title }, { apiKey: env.IMDB_TOKEN, timeout: 30000 });
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
