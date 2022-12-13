import ytSearch, { YouTubeSearchResults } from 'youtube-search';

const F = f(__filename);

export default youtube;

/**
 * Looks up youtube videos
 * @param {string} query What video do you want?
 * @return {any} Something
 */
export async function youtube(query:string):Promise<YouTubeSearchResults> {
  /**
   * This needs to be in a separate function cuz it's not async
   * @param {string} query What video do you want?
   * @return {Promise<YouTubeSearchResults[]>}
  * */
  async function getResults(search:string) {
    return new Promise((resolve, reject) => {
      ytSearch(search, {
        key: env.YOUTUBE_TOKEN,
        type: 'video',
        maxResults: 1,
        order: 'relevance',
        safeSearch: 'strict',
      }, (err, result) => {
        if (err) {
          reject(err);
        }
        if (!result) {
          resolve(null);
        } else {
          resolve(result);
        }
      });
    });
  }

  const results = (await getResults(query) as YouTubeSearchResults[])[0];
  log.info(F, `response: ${JSON.stringify(results.title, null, 2)}`);
  return results;
}
