import env from '../utils/env.config';
import * as imdb from 'imdb-api';
// const imdb = require('imdb-api');
// import logger from '../utils/logger';
// const PREFIX = require('path').parse(__filename).name;

/**
 *
 * @param {string} title
 * @return {any}
 */
export async function getImdb(title:string):Promise<any> {
  return await imdb.get({name: title}, {apiKey: env.IMDB_TOKEN, timeout: 30000});
};
