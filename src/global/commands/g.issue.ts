import { Octokit } from 'octokit';
import { OctokitResponse } from '@octokit/types';
import { Issue } from '@octokit/webhooks-types';

const F = f(__filename);

export default issue;

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
    return new Promise(async (resolve, reject) => { // eslint-disable-line no-async-promise-executor
      // Use octokit to create an issue
      const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
      await octokit.rest.issues.create({
        owner: 'TripSit',
        repo: 'TripBot',
        title,
        body,
      })
        .then(async (response:OctokitResponse<Issue>) => {
          const issueNumber = response.data.number;
          octokit.rest.issues.addLabels({
            owner: 'TripSit',
            repo: 'TripBot',
            issue_number: issueNumber,
            labels,
          });
          resolve(response as OctokitResponse<Issue>);
        })
        .catch((error:Error) => {
          reject(error);
        });
    });
  }

  const results = await getResults();
  log.info(F, `response: ${JSON.stringify(results, null, 2)}`);

  return results;
}
