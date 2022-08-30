import env from '../utils/env.config';
import logger from '../utils/logger';
import search from 'youtube-search';
const PREFIX = require('path').parse(__filename).name;

/**
 * Looks up youtube videos
 * @param {string} query What video do you want?
 * @return {any} Something
 */
export async function youtubeSearch(query:string):Promise<any> {
  return new Promise((resolve, reject) => {
    search(query, {maxResults: 1, key: env.YOUTUBE_TOKEN}, (err, result) => {
      if (err) {
        logger.debug(`[${PREFIX}] rejected!`);
        reject(err);
      }
      logger.debug(`[${PREFIX}] finished!`);
      resolve(result);
    });
  });
};
