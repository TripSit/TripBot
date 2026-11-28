import { createHash } from 'crypto';
import { DiscordAPIError } from 'discord.js';
import { isPreSendFailure } from './networkErrors';
import { ReportLimiter, withTimeout } from './errorReporter';

const F = f(__filename);

const OWNER = 'TripSit';
const REPO = 'TripBot';
const FILE_TIMEOUT_MS = 15_000;
const MAX_BODY_STACK = 3000;
const REPEAT_COMMENT_MS = 24 * 60 * 60 * 1000;
export const ERROR_ISSUE_LABELS = ['T: Bug', 'P2', 'S0: Review Needed', 'bot-error'];

// Discord errors that are the user's or Discord's doing, not a bug in this code:
// unknown interaction/message/channel/user/member, already acknowledged, cannot DM the user
const IGNORED_DISCORD_CODES = new Set([10003, 10007, 10008, 10013, 10062, 40060, 50007]);

// At most 3 new issues an hour: a crash loop must not flood the tracker (or the auto-fix budget)
const issueLimiter = new ReportLimiter(3, 3_600_000, 3_600_000);
const lastCommented = new Map<string, number>();

/** The repository is public, so strip anything that could identify a person or grant access. */
export function sanitizeForIssue(text: string): string {
  return text
    .replace(/[\w.-]{20,}\.[\w-]{6,}\.[\w-]{20,}/g, '<token>')
    .replace(/\b(?:gh[pousr]_|github_pat_)\w+/g, '<token>')
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '<email>')
    .replace(/\b\d{17,20}\b/g, '<id>')
    .replace(/\/(?:home|Users)\/[^/\s]+/g, '/<home>')
    .replace(/(\/(?:webhooks|interactions)\/)[^\s/]+\/[^\s/)]+/g, '$1<id>/<token>');
}

/** False for transient network failures and Discord errors that are not defects in the bot. */
export function isReportableError(errorData: unknown): boolean {
  if (isPreSendFailure(errorData)) return false;
  if (errorData instanceof DiscordAPIError) {
    if (IGNORED_DISCORD_CODES.has(Number(errorData.code))) return false;
    if (errorData.status >= 500) return false;
  }
  return true;
}

/** Groups repeats of the same defect: error name plus the first stack frames, with ids and line noise removed. */
export function errorFingerprint(errorData: unknown, stack: string): string {
  const name = errorData instanceof Error ? errorData.name : typeof errorData;
  const frames = stack.split('\n').filter(l => l.trim().startsWith('at ')).slice(0, 3);
  const basis = frames.length ? frames.join('|') : stack.split('\n')[0];
  return createHash('sha1').update(`${name}|${sanitizeForIssue(basis)}`).digest('hex').slice(0, 10);
}

function buildBody(fingerprint: string, stack: string, commandName?: string): string {
  const clean = sanitizeForIssue(stack);
  const shown = clean.length > MAX_BODY_STACK ? `${clean.slice(0, MAX_BODY_STACK)}\n... (truncated)` : clean;
  return [
    'Filed automatically by TripBot after an unhandled error in production.',
    '',
    commandName ? `**Command:** \`/${commandName}\`` : '**Command:** none (event handler, timer or background task)',
    `**Fingerprint:** \`fp:${fingerprint}\``,
    '',
    '```',
    shown,
    '```',
    '',
    'Ids, tokens, emails and user content are redacted. Repeat occurrences are added as comments.',
  ].join('\n');
}

async function fileUnsafe(errorData: unknown, stack: string, commandName?: string): Promise<void> {
  const fingerprint = errorFingerprint(errorData, stack);
  // Loaded dynamically: octokit ships ESM-only and must not be evaluated at module-load time.
  const { Octokit } = await import('octokit');
  const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

  const found = await octokit.rest.search.issuesAndPullRequests({
    q: `repo:${OWNER}/${REPO} is:issue is:open label:bot-error "fp:${fingerprint}" in:body`,
    per_page: 1,
  });
  const existing = found.data.items[0];
  if (existing) {
    const last = lastCommented.get(fingerprint) ?? 0;
    if (Date.now() - last < REPEAT_COMMENT_MS) return;
    lastCommented.set(fingerprint, Date.now());
    await octokit.rest.issues.createComment({
      owner: OWNER,
      repo: REPO,
      issue_number: existing.number,
      body: `Seen again at ${new Date().toISOString()}.`,
    });
    return;
  }

  if (!issueLimiter.allow(fingerprint)) {
    log.warn(F, `Not filing an issue for ${fingerprint}: new-issue limit reached`);
    return;
  }
  const headline = sanitizeForIssue(stack.split('\n')[0]).slice(0, 120);
  const created = await octokit.rest.issues.create({
    owner: OWNER,
    repo: REPO,
    title: `[bot-error] ${headline}`,
    body: buildBody(fingerprint, stack, commandName),
    labels: ERROR_ISSUE_LABELS,
  });
  lastCommented.set(fingerprint, Date.now());
  log.info(F, `Filed error issue #${created.data.number} (${fingerprint})`);
}

/**
 * Opens (or updates) a GitHub issue for a production error so it is tracked, not just logged. The
 * AutoFixErrors workflow picks the issue up and proposes a fix PR. Never throws.
 */
export default async function fileErrorIssue(
  errorData: unknown,
  stack: string,
  commandName?: string,
): Promise<void> {
  if (env.NODE_ENV !== 'production' || !env.GITHUB_TOKEN) return;
  if (!isReportableError(errorData)) return;
  try {
    await withTimeout(fileUnsafe(errorData, stack, commandName), FILE_TIMEOUT_MS, 'Filing the error issue');
  } catch (err) {
    // Not log.error: that would route back through the error reporter
    console.error('Could not file the error issue:', (err as Error).message); // eslint-disable-line no-console
  }
}
