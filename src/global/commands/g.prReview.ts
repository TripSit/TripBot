const F = f(__filename);

const GITHUB_OWNER = 'TripSit';
const GITHUB_REPO = 'TripBot';

/**
 * Extracts the HTTP status and message from an Octokit RequestError so
 * failures (branch protection, merge conflicts, insufficient approvals,
 * revoked token, etc.) are actually distinguishable in the logs.
 * @param {unknown} error
 */
function describeGithubError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const status = (error as { status?: number } | undefined)?.status;
  return status ? `HTTP ${status}: ${message}` : message;
}

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
  // import graph (via pr.routes.ts).
  const { Octokit } = await import('octokit');
  const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
  log.debug(F, `Posting rejection comment on PR #${prNumber} for ${displayName}: ${comment}`);
  try {
    await octokit.rest.issues.createComment({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      issue_number: prNumber,
      body: `**Rejected by ${displayName}:**\n\n${comment}`,
    });
  } catch (error) {
    log.error(F, `GitHub rejected comment on PR #${prNumber}: ${describeGithubError(error)}`);
    throw error;
  }
  log.info(F, `Posted rejection comment on PR #${prNumber} for ${displayName}`);
}

/**
 * Squash-merges the GitHub PR. Throws if GitHub rejects the merge (failing
 * required checks, conflicts, insufficient approvals, etc.) so the caller
 * can report the failure back to whoever clicked accept.
 * @param {number} prNumber
 * @param {string} [actor] Display name of whoever triggered the merge, for logging.
 */
export async function mergePr(prNumber: number, actor?: string): Promise<void> {
  const { Octokit } = await import('octokit');
  const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
  const actorSuffix = actor ? ` (requested by ${actor})` : '';
  log.debug(F, `Attempting to squash-merge PR #${prNumber}${actorSuffix}`);
  try {
    await octokit.rest.pulls.merge({
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      pull_number: prNumber,
      merge_method: 'squash',
    });
  } catch (error) {
    log.error(F, `GitHub rejected merge of PR #${prNumber}: ${describeGithubError(error)}`);
    throw error;
  }
  log.info(F, `Squash-merged PR #${prNumber}${actorSuffix}`);
}
