import {getUser} from '../utils/knex';
// import {Users} from '../@types/pgdb';
// import log from '../utils/log';
// import * as path from 'path';
// import {stripIndents} from 'common-tags';
// const PREFIX = path.parse(__filename).name;

/**
 * @param {string} userId
 * @return {any}
 */
export async function h2flow(userId:string):Promise<any> {
  return await getUser(userId, null);
};
