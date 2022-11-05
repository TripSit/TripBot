import {Octokit} from 'octokit';
import {OctokitResponse} from '@octokit/types';
import {Issue} from '@octokit/webhooks-types';
import env from '../utils/env.config';
import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

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
):Promise<OctokitResponse<Issue>> {
  /**
   * This needs to be in a separate function cuz it's not async
   */
  async function getResults():Promise<OctokitResponse<Issue>> {
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
          resolve(response as OctokitResponse<Issue>);
        })
        .catch((error:Error) => {
          reject(error);
        });
    });
  }

  const results = await getResults() as OctokitResponse<Issue>;
  log.info(`[${PREFIX}] response: ${JSON.stringify(results, null, 2)}`);

  return results;
};
