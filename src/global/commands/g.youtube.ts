import env from '../utils/env.config';
import {YouTubeSearchResults} from 'youtube-search';
import ytSearch from 'youtube-search';
import log from '../../global/utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

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
  **/
  async function getResults(query:string) {
    return new Promise((resolve, reject) => {
      ytSearch(query, {
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

  const results = await getResults(query) as YouTubeSearchResults[][0];
  log.info(`[${PREFIX}] response: ${JSON.stringify(results, null, 2)}`);
  return results;
};
