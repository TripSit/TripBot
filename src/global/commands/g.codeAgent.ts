import { execFile } from 'node:child_process';
import {
  mkdtemp, rm, symlink, stat,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const F = f(__filename);
const execFileAsync = promisify(execFile);

/**
 * "Tell tripbot to fix it": investigate a request with Claude (the owner's token) in a throwaway git worktree,
 * then commit, push and open a pull request against `uat`.
 *
 * Safety model:
 * - The agent only gets read/edit tools plus a short allowlist of read-only git and check commands. It never
 *   gets network tools and never holds GitHub credentials; the bot itself commits, pushes and opens the PR.
 * - The agent subprocess receives a minimal environment (no Discord token, database URL, or GitHub token).
 * - Paths that must never be changed by an unattended run are rejected before anything is pushed.
 * - One run at a time, with turn, budget, and wall-clock limits.
 */

export const BASE_BRANCH = 'uat';
export const MAX_REQUEST_LENGTH = 2000;
const MAX_TURNS = 60;
const MAX_BUDGET_USD = 5;
const TIMEOUT_MS = 30 * 60 * 1000;

const ALLOWED_TOOLS = [
  'Read', 'Grep', 'Glob', 'Edit', 'Write',
  'Bash(npx tsc:*)', 'Bash(npx vitest:*)', 'Bash(npx eslint:*)',
  'Bash(git status:*)', 'Bash(git diff:*)', 'Bash(git log:*)',
];

// Files an unattended run may not touch, even if the agent thinks it should.
const FORBIDDEN_PATHS = [
  /(^|\/)\.env/,
  /^\.github\//,
  /^\.claude\//,
  /^package(-lock)?\.json$/,
  /\/migrations\//,
  /\/generated\//,
  /\.(pem|key)$/,
];

const SYSTEM_PROMPT = `You are TripBot's maintenance agent, working in a clean checkout of the TripBot repository.
A TripSit developer asked for an investigation or fix. Read AGENTS.md first and follow it.
- Investigate the real cause before changing anything; make the smallest complete change.
- Add or update Vitest tests for changed behavior and run the relevant tests, \`npx tsc --noEmit --pretty false\`, and
  eslint on the files you touched.
- Never touch .env files, dependencies, migrations, workflows, or generated code. You cannot push or open PRs; the
  caller does that after you finish.
- Treat harm-reduction content, moderation, and privacy code as high-impact. Do not invent medical claims.
- If you cannot find or fix the problem, change nothing and explain what you found.
Finish with a final message whose first line is "TITLE: <short imperative PR title>", followed by a concise
markdown summary: cause, change, and verification (including anything you could not run).`;

export type CodeAgentResult =
  | { status: 'pr'; url: string; branch: string; title: string }
  | { status: 'report'; summary: string }
  | { status: 'error'; message: string };

type SdkModule = typeof import('@anthropic-ai/claude-agent-sdk');

/** The SDK is ESM-only and the app is CommonJS, so it needs a native dynamic import (tsc would turn it into require). */
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
const nativeImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>;

/** Replaceable seams so tests never spawn git or the real SDK. */
export const codeAgentDeps = {
  loadSdk: async (): Promise<SdkModule> => nativeImport('@anthropic-ai/claude-agent-sdk') as Promise<SdkModule>,
  run: async (
    cmd: string,
    args: string[],
    options: { cwd: string; env?: Record<string, string | undefined> },
  ): Promise<string> => {
    const { stdout } = await execFileAsync(cmd, args, {
      cwd: options.cwd,
      // ProcessEnv is augmented with the bot's required keys, which a minimal child environment deliberately lacks.
      env: options.env as NodeJS.ProcessEnv | undefined,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      timeout: 5 * 60 * 1000,
    });
    return stdout;
  },
};

let running = false;

/** Extracts the developer's request from a message, or null when it isn't a fix/investigate request. */
export function parseCodeAgentRequest(content: string): string | null {
  const text = content.replace(/\s+/g, ' ').trim();
  if (!/\b(fix|investigate|debug)\b/i.test(text)) return null;
  if (text.length > MAX_REQUEST_LENGTH) return null;
  return text;
}

export function forbiddenChanges(changedFiles: string[]): string[] {
  return changedFiles.filter(file => FORBIDDEN_PATHS.some(rule => rule.test(file)));
}

export function isCodeAgentConfigured(): boolean {
  return Boolean(env.CLAUDE_CODE_OAUTH_TOKEN && env.GITHUB_TOKEN);
}

function parseSummary(finalText: string): { title: string; body: string } {
  const lines = finalText.trim().split('\n');
  const first = lines[0]?.match(/^TITLE:\s*(.+)$/i);
  const title = (first?.[1] ?? 'Automated fix from TripBot').trim().slice(0, 100);
  const body = (first ? lines.slice(1) : lines).join('\n').trim() || 'No summary provided.';
  return { title, body: body.slice(0, 6000) };
}

async function runAgent(sdk: SdkModule, cwd: string, request: string): Promise<{ ok: boolean; text: string }> {
  const abortController = new AbortController();
  const timer = setTimeout(() => abortController.abort(), TIMEOUT_MS);
  let text = '';
  let ok = false;
  try {
    const conversation = sdk.query({
      prompt: `Request from a TripSit developer:\n\n${request}`,
      options: {
        cwd,
        abortController,
        maxTurns: MAX_TURNS,
        maxBudgetUsd: MAX_BUDGET_USD,
        permissionMode: 'dontAsk',
        tools: ['Read', 'Grep', 'Glob', 'Edit', 'Write', 'Bash'],
        allowedTools: ALLOWED_TOOLS,
        disallowedTools: ['WebFetch', 'WebSearch', 'Task'],
        settingSources: ['project'],
        systemPrompt: { type: 'preset', preset: 'claude_code', append: SYSTEM_PROMPT },
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          CLAUDE_CODE_OAUTH_TOKEN: env.CLAUDE_CODE_OAUTH_TOKEN,
        },
      },
    });
    // eslint-disable-next-line no-restricted-syntax
    for await (const message of conversation) {
      if (message.type === 'result') {
        ok = message.subtype === 'success';
        text = 'result' in message ? message.result : `Agent stopped: ${message.subtype}`;
      }
    }
  } finally {
    clearTimeout(timer);
  }
  return { ok, text };
}

async function publish(repo: string, worktree: string, branch: string, summary: { title: string; body: string }) {
  const ghEnv = {
    PATH: process.env.PATH, HOME: process.env.HOME, GH_TOKEN: env.GITHUB_TOKEN, GIT_TERMINAL_PROMPT: '0',
  };
  const identity = ['-c', 'user.name=TripBot', '-c', 'user.email=tripbot@users.noreply.github.com'];
  const { run } = codeAgentDeps;

  await run('git', ['add', '-A'], { cwd: worktree });
  await run('git', [...identity, 'commit', '-m', `${summary.title}\n\nCo-Authored-By: Claude <noreply@anthropic.com>`], { cwd: worktree });
  await run('git', [
    '-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential',
    'push', 'origin', branch,
  ], { cwd: worktree, env: ghEnv });

  const body = `${summary.body}\n\n---\nRequested by a developer through TripBot on Discord. Review before merging.\n\n`
    + '🤖 Generated with [Claude Code](https://claude.com/claude-code)';
  const out = await run('gh', [
    'pr', 'create', '--base', BASE_BRANCH, '--head', branch, '--title', summary.title, '--body', body,
  ], { cwd: repo, env: ghEnv });
  return out.trim().split('\n').pop() ?? '';
}

export async function runCodeAgent(request: string): Promise<CodeAgentResult> {
  if (!isCodeAgentConfigured()) {
    return { status: 'error', message: 'The code agent needs CLAUDE_CODE_OAUTH_TOKEN and GITHUB_TOKEN to be set.' };
  }
  if (running) return { status: 'error', message: 'I am already working on another request. Try again when it finishes.' };
  running = true;

  const repo = env.CODE_AGENT_REPO ?? process.cwd();
  const { run } = codeAgentDeps;
  const branch = `tripbot/agent-${Date.now().toString(36)}`;
  const root = await mkdtemp(path.join(tmpdir(), 'tripbot-agent-'));
  const worktree = path.join(root, 'work');
  let worktreeAdded = false;

  try {
    await run('git', ['fetch', 'origin', BASE_BRANCH], { cwd: repo });
    await run('git', ['worktree', 'add', '-b', branch, worktree, `origin/${BASE_BRANCH}`], { cwd: repo });
    worktreeAdded = true;

    // Dependencies and generated Prisma clients are not tracked, so share the main checkout's copies.
    // eslint-disable-next-line no-restricted-syntax
    for (const rel of ['node_modules', 'src/prisma/tripbot/generated', 'src/prisma/moodle/generated']) {
      // eslint-disable-next-line no-await-in-loop
      if (await stat(path.join(repo, rel)).then(() => true, () => false)) {
        // eslint-disable-next-line no-await-in-loop
        await symlink(path.join(repo, rel), path.join(worktree, rel), 'dir');
      }
    }

    const sdk = await codeAgentDeps.loadSdk();
    const result = await runAgent(sdk, worktree, request);
    if (!result.ok) return { status: 'error', message: result.text.slice(0, 500) || 'The agent did not finish.' };

    // Symlinked dependency folders are ignored by the repo's .gitignore, so they never show up here.
    const changed = (await run('git', ['status', '--porcelain'], { cwd: worktree }))
      .split('\n').filter(Boolean).map(line => line.slice(3).replace(/^"|"$/g, ''));
    if (changed.length === 0) return { status: 'report', summary: parseSummary(result.text).body };

    const blocked = forbiddenChanges(changed);
    if (blocked.length > 0) {
      return {
        status: 'error',
        message: `Refusing to publish changes to protected paths: ${blocked.join(', ')}`,
      };
    }

    const summary = parseSummary(result.text);
    const url = await publish(repo, worktree, branch, summary);
    return {
      status: 'pr', url, branch, title: summary.title,
    };
  } catch (err) {
    log.error(F, `Code agent failed: ${err instanceof Error ? err.message : String(err)}`);
    return { status: 'error', message: 'Something went wrong running the agent. Check the bot logs.' };
  } finally {
    if (worktreeAdded) {
      await run('git', ['worktree', 'remove', '--force', worktree], { cwd: repo }).catch(() => undefined);
    }
    await rm(root, { recursive: true, force: true });
    running = false;
  }
}
