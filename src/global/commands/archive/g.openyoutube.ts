import * as yt from 'youtube-search-without-api-key';
// import logger from '../utils/logger';
// const PREFIX = require('path').parse(__filename).name;

/**
 * Looks up youtube videos
 * @param {string} query What video do you want?
 * @return {any} Something
 */
export async function youtubeSearch(query:string):Promise<{
  id: {
      videoId: any;
  };
  url: string;
  title: string;
  description: any;
  duration_raw: any;
  snippet: {
      url: string;
      duration: any;
      publishedAt: any;
      thumbnails: {
          id: any;
          url: any;
          default: any;
          high: any;
          height: any;
          width: any;
      };
      title: string;
      views: any;
  };
  views: any;
}[]> {
  // logger.debug(`${PREFIX} started!`);
  // logger.debug(`${PREFIX} query: ${query}`);
  // const reponse = await yt.search(query);
  // logger.debug(`${PREFIX} reponse: ${JSON.stringify(reponse, null, 2)}`);
  // logger.debug(`${PREFIX} finished!`);
  // return reponse;
  return await yt.search(query);
};
