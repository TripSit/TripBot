import * as imdbApi from 'imdb-api';

const F = f(__filename);

export default imdb;

const imdbClient = new imdbApi.Client({
  apiKey: env.IMDB_TOKEN,
  timeout: 30_000,
});

export async function imdb(title: string): Promise<imdbApi.Movie> {
  let response = {} as imdbApi.Movie;
  await imdbClient
    .search({
      name: title,
    })
    .then(async (search) => {
      await imdbClient
        .get({
          name: search.results[0].name,
        })
        .then((movie) => {
          log.debug(F, `movie: ${JSON.stringify(movie, null, 2)}`);
          response = movie;
          return response;
        })
        .catch((error: Error) => {
          if (!error.message.includes('Movie not found!')) {
            log.error(F, `get err: ${JSON.stringify(error, null, 2)}`);
          }
        });
    })
    .catch((error: Error) => {
      if (!error.message.includes('Movie not found!')) {
        log.error(F, `search err: ${JSON.stringify(error, null, 2)}`);
      }
    });

  return response;
}
