const F = f(__filename);

const GITHUB_OWNER = 'TripSit';
const GITHUB_REPO = 'TripBot';

export default postPrRejectionComment;

/**
 * Posts a comment on the GitHub PR as the bot, attributing it to the
 * display name of whoever submitted it via their platform of choice.
 * @param {number} prNumber
 * @param {string} displayName
 * @param {string} comment
 */
export async function postPrRejectionComment(
  prNumber: number,
  displayName: string,
  comment: string,
): Promise<void> {
  // Loaded dynamically: octokit ships ESM-only and must not be evaluated at
  // module-load time, since g.prReview.ts is pulled into the Express API's
  // import graph (via pr.routes.ts) which ts-jest cannot transform.
  const { Octokit } = await import('octokit');
  const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
  await octokit.rest.issues.createComment({
    owner: GITHUB_OWNER,
    repo: GITHUB_REPO,
    issue_number: prNumber,
    body: `**Rejected by ${displayName}:**\n\n${comment}`,
  });
  log.info(F, `Posted rejection comment on PR #${prNumber} for ${displayName}`);
}
