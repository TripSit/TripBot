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
  const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
  let results: OctokitResponse<Issue>;
  try {
    // Use octokit to create an issue
    results = await octokit.rest.issues.create({
      owner: 'TripSit',
      repo: 'TripBot',
      title,
      body,
    }) as unknown as OctokitResponse<Issue>;
  } catch (error) {
    log.error(F, `Failed to create GitHub issue '${title}': ${(error as Error).message}`);
    throw error;
  }

  const issueNumber = results.data.number;
  octokit.rest.issues.addLabels({
    owner: 'TripSit',
    repo: 'TripBot',
    issue_number: issueNumber,
    labels,
  }).catch((error: Error) => {
    log.error(F, `Failed to add labels to issue #${issueNumber}: ${error.message}`);
  });

  log.info(F, `response: ${JSON.stringify(results, null, 2)}`);

  return results;
}
