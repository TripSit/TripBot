import {Octokit} from 'octokit';
import env from '../utils/env.config';
// import logger from '../utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

/**
 * Submit github issue
 * @param {string} title
 * @param {string} body
 * @param {string[]} labels
 */
export async function issue(
  title: string,
  body: string,
  labels: string[],
):Promise<any> {
  /**
   * This needs to be in a separate function cuz it's not async
   */
  async function getResults() {
    return new Promise(async (resolve, reject) => {
      // Use octokit to create an issue
      const octokit = new Octokit({auth: env.GITHUB_TOKEN});
      await octokit.rest.issues.create({
        owner: 'TripSit',
        repo: 'tripsit-discord-bot',
        title,
        body,
      })
        .then(async (response) => {
          const issueNumber = response.data.number;
          octokit.rest.issues.addLabels({
            owner: 'TripSit',
            repo: 'tripsit-discord-bot',
            issue_number: issueNumber,
            labels: labels,
          });
          resolve(response.data);
        })
        .catch((error:Error) => {
          reject(error);
        });
    });
  }

  const results = await getResults();

  return results;
};
