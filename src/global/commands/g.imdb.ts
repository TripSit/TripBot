import * as imdbApi from 'imdb-api';

const F = f(__filename);

export default imdb;

const imdbClient = new imdbApi.Client({
  apiKey: env.IMDB_TOKEN,
  timeout: 30000,
});

export async function imdb(title:string):Promise<imdbApi.Movie> {
  let response = {} as imdbApi.Movie;
  await imdbClient.search({
    name: title,
  }).then(async search => {
    await imdbClient.get({
      name: search.results[0].name,
    }).then(movie => {
      log.debug(F, `movie: ${JSON.stringify(movie, null, 2)}`);
      response = movie;
      return response;
    }).catch((err:Error) => {
      if (!err.message.includes('Movie not found!')) {
        log.error(F, `IMDB get failed for '${title}': ${err.message}`);
      }
    });
  }).catch((err:Error) => {
    if (!err.message.includes('Movie not found!')) {
      log.error(F, `IMDB search failed for '${title}': ${err.message}`);
    }
  });

  return response;
}
