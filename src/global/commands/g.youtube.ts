import env from '../utils/env.config';
import ytSearch from 'youtube-search';
import logger from '../utils/logger';
const PREFIX = require('path').parse(__filename).name;

/**
 * Looks up youtube videos
 * @param {string} query What video do you want?
 * @return {any} Something
 */
export async function youtubeSearch(query:string) {
  return new Promise((resolve, reject) => {
    ytSearch(query, {key: env.YOUTUBE_TOKEN}, (err, result) => {
      if (err) {
        logger.debug(`[${PREFIX}] rejected!`);
        reject(err);
      }
      logger.debug(`[${PREFIX}] finished!`);
      resolve(result);
    });
  });
};
