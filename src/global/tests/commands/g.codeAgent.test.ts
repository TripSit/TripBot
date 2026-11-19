import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  codeAgentDeps, forbiddenChanges, isCodeAgentConfigured, parseCodeAgentRequest, runCodeAgent,
} from '../../commands/g.codeAgent';

const e = env as unknown as Record<string, string | undefined>;
const original = { ...e };

/** Stand in for `git worktree add`: the tracked prisma folders exist in a real checkout. */
async function makeWorktree(dir: string) {
  await mkdir(path.join(dir, 'src/prisma/tripbot'), { recursive: true });
  await mkdir(path.join(dir, 'src/prisma/moodle'), { recursive: true });
}

type Msg = { type: 'result'; subtype: string; result?: string };

function fakeSdk(messages: Msg[]) {
  const query = vi.fn(() => (async function* gen() { yield* messages; }()));
  return { query } as never;
}

describe('parseCodeAgentRequest', () => {
  it('accepts fix/investigate/debug requests and normalizes whitespace', () => {
    expect(parseCodeAgentRequest('hey tripbot,\nthere is an issue with /ping, fix it')).toBe(
      'hey tripbot, there is an issue with /ping, fix it',
    );
    expect(parseCodeAgentRequest('please INVESTIGATE the crash')).not.toBeNull();
  });

  it('ignores ordinary chatter and oversized requests', () => {
    expect(parseCodeAgentRequest('hello tripbot')).toBeNull();
    expect(parseCodeAgentRequest(`fix ${'a'.repeat(2100)}`)).toBeNull();
  });
});

describe('forbiddenChanges', () => {
  it('flags secrets, workflows, dependencies, migrations and generated code', () => {
    const files = [
      'src/a.ts', '.env', 'src/.env.local', '.github/workflows/ci.yml', 'package.json', 'package-lock.json',
      'src/prisma/tripbot/migrations/1/migration.sql', 'src/prisma/tripbot/generated/x.ts', 'deploy.pem', '.claude/settings.json',
    ];
    expect(forbiddenChanges(files)).toEqual(files.slice(1));
  });
});

describe('default dependencies', () => {
  it('runs a real command and captures stdout', async () => {
    const out = await codeAgentDeps.run('node', ['-e', 'process.stdout.write("hi")'], { cwd: process.cwd() });
    expect(out).toBe('hi');
  });

  it('loads the agent SDK through a native import (unavailable inside the test VM)', async () => {
    await expect(codeAgentDeps.loadSdk()).rejects.toThrow();
  });
});

describe('runCodeAgent', () => {
  const run = vi.fn();
  const originalDeps = { ...codeAgentDeps };

  beforeEach(() => {
    e.CLAUDE_CODE_OAUTH_TOKEN = 'claude-token';
    e.GITHUB_TOKEN = 'gh-token';
    e.CODE_AGENT_REPO = '/nonexistent-repo';
    run.mockReset();
    // Stand in for `git worktree add`, which would have created the directory the bot then links into.
    run.mockImplementation(async (_cmd: string, args: string[]) => {
      if (args[0] === 'worktree' && args[1] === 'add') await makeWorktree(args[4]);
      return '';
    });
    codeAgentDeps.run = run;
  });

  afterEach(() => {
    Object.assign(codeAgentDeps, originalDeps);
    Object.keys(original).forEach(k => { e[k] = original[k]; });
  });

  it('refuses to run without both tokens', async () => {
    e.CLAUDE_CODE_OAUTH_TOKEN = undefined;
    expect(isCodeAgentConfigured()).toBe(false);
    expect(await runCodeAgent('fix it')).toMatchObject({ status: 'error' });
    expect(run).not.toHaveBeenCalled();
  });

  it('opens a PR from the agent\'s changes using a minimal environment for the agent', async () => {
    const sdk = fakeSdk([{ type: 'result', subtype: 'success', result: 'TITLE: Fix ping\n\nCause and fix.' }]);
    codeAgentDeps.loadSdk = async () => sdk;
    run.mockImplementation(async (cmd: string, args: string[]) => {
      if (args[0] === 'status') return ' M src/a.ts\n?? src/a.test.ts\n';
      if (cmd === 'gh') return 'https://github.com/TripSit/TripBot/pull/9\n';
      return '';
    });

    const result = await runCodeAgent('fix ping');

    expect(result).toMatchObject({
      status: 'pr', url: 'https://github.com/TripSit/TripBot/pull/9', title: 'Fix ping',
    });
    const { options } = (sdk as unknown as { query: ReturnType<typeof vi.fn> }).query.mock.calls[0][0];
    expect(options.permissionMode).toBe('dontAsk');
    expect(options.env).toEqual({
      PATH: process.env.PATH, HOME: process.env.HOME, CLAUDE_CODE_OAUTH_TOKEN: 'claude-token',
    });
    expect(options.allowedTools).not.toContain('Bash');

    const calls = run.mock.calls.map(c => [c[0], ...c[1]].join(' '));
    expect(calls.some(c => c.startsWith('git fetch origin uat'))).toBe(true);
    expect(calls.some(c => c.includes('push origin tripbot/agent-'))).toBe(true);
    expect(calls.some(c => c.startsWith('gh pr create --base uat'))).toBe(true);
    const pushEnv = run.mock.calls.find(c => c[1].includes('push'))?.[2].env;
    expect(pushEnv).toMatchObject({ GH_TOKEN: 'gh-token' });
    expect(pushEnv).not.toHaveProperty('DISCORD_CLIENT_TOKEN');
    expect(calls.some(c => c.startsWith('git worktree remove --force'))).toBe(true);
  });

  it('preserves a title with a long whitespace prefix', async () => {
    const summary = `tItLe:${' '.repeat(100_000)}Fix spacing\n\nCause and fix.`;
    codeAgentDeps.loadSdk = async () => fakeSdk([{ type: 'result', subtype: 'success', result: summary }]);
    run.mockImplementation(async (_cmd: string, args: string[]) => (args[0] === 'status' ? ' M src/a.ts\n' : ''));
    expect(await runCodeAgent('fix spacing')).toMatchObject({ status: 'pr', title: 'Fix spacing' });
    const publish = run.mock.calls.find(call => call[0] === 'gh');
    expect(publish?.[1].at(-1)).toContain('Cause and fix.');
  });

  it('reports findings without a PR when nothing changed', async () => {
    codeAgentDeps.loadSdk = async () => fakeSdk([{ type: 'result', subtype: 'success', result: 'Could not reproduce.' }]);
    expect(await runCodeAgent('investigate x')).toEqual({ status: 'report', summary: 'Could not reproduce.' });
    expect(run.mock.calls.some(c => c[1].includes('push'))).toBe(false);
  });

  it('never pushes changes to protected paths', async () => {
    codeAgentDeps.loadSdk = async () => fakeSdk([{ type: 'result', subtype: 'success', result: 'done' }]);
    run.mockImplementation(async (_cmd: string, args: string[]) => (args[0] === 'status' ? ' M .env\n' : ''));
    const result = await runCodeAgent('fix x');
    expect(result).toMatchObject({ status: 'error' });
    expect(run.mock.calls.some(c => c[1].includes('push'))).toBe(false);
  });

  it('reports agent failures and still cleans up', async () => {
    codeAgentDeps.loadSdk = async () => fakeSdk([{ type: 'result', subtype: 'error_max_turns' }]);
    expect(await runCodeAgent('fix x')).toMatchObject({ status: 'error' });
    expect(run.mock.calls.some(c => c[1].includes('remove'))).toBe(true);
  });

  it('turns unexpected exceptions into a generic error', async () => {
    run.mockRejectedValue(new Error('git exploded with /secret/path'));
    const result = await runCodeAgent('fix x');
    expect(result).toEqual({ status: 'error', message: 'Something went wrong running the agent. Check the bot logs.' });
  });

  it('links the checkout dependencies, defaults the title, and ignores non-result messages', async () => {
    e.CODE_AGENT_REPO = process.cwd();
    codeAgentDeps.loadSdk = async () => fakeSdk([
      { type: 'assistant' } as never,
      { type: 'result', subtype: 'success', result: '   ' },
    ]);
    run.mockImplementation(async (cmd: string, args: string[]) => {
      if (args[0] === 'worktree' && args[1] === 'add') await makeWorktree(args[4]);
      if (args[0] === 'status') return ' M "src/a b.ts"\n';
      if (cmd === 'gh') return '';
      return '';
    });
    expect(await runCodeAgent('fix x')).toMatchObject({ status: 'pr', title: 'Automated fix from TripBot', url: '' });
  });

  it('falls back to the working directory and a default summary when nothing is configured or said', async () => {
    e.CODE_AGENT_REPO = undefined;
    codeAgentDeps.loadSdk = async () => fakeSdk([{ type: 'result', subtype: 'success', result: '' }]);
    expect(await runCodeAgent('fix x')).toEqual({ status: 'report', summary: 'No summary provided.' });
    expect(run.mock.calls[0][2].cwd).toBe(process.cwd());
  });

  it('reports a default message when the agent fails silently', async () => {
    codeAgentDeps.loadSdk = async () => fakeSdk([{ type: 'result', subtype: 'success_not', result: '' }]);
    expect(await runCodeAgent('fix x')).toMatchObject({ status: 'error', message: 'The agent did not finish.' });
  });

  it('ignores a failed worktree cleanup', async () => {
    codeAgentDeps.loadSdk = async () => fakeSdk([{ type: 'result', subtype: 'success', result: 'x' }]);
    run.mockImplementation(async (_cmd: string, args: string[]) => {
      if (args[0] === 'worktree' && args[1] === 'add') await makeWorktree(args[4]);
      if (args[1] === 'remove') throw new Error('busy');
      return '';
    });
    expect(await runCodeAgent('fix x')).toMatchObject({ status: 'report' });
  });

  it('describes non-Error failures too', async () => {
    run.mockRejectedValue('plain string failure');
    expect(await runCodeAgent('fix x')).toMatchObject({ status: 'error' });
  });

  it('aborts the agent when the wall-clock limit passes', async () => {
    const timeout = vi.spyOn(global, 'setTimeout').mockImplementation(((fn: () => void) => {
      fn();
      return 0 as never;
    }) as never);
    const sdk = fakeSdk([{ type: 'result', subtype: 'success', result: 'x' }]);
    codeAgentDeps.loadSdk = async () => sdk;
    await runCodeAgent('fix x');
    timeout.mockRestore();
    const { options } = (sdk as unknown as { query: ReturnType<typeof vi.fn> }).query.mock.calls[0][0];
    expect(options.abortController.signal.aborted).toBe(true);
  });

  it('allows only one run at a time', async () => {
    let release: () => void = () => undefined;
    codeAgentDeps.loadSdk = async () => {
      await new Promise<void>(resolve => { release = resolve; });
      return fakeSdk([{ type: 'result', subtype: 'success', result: 'x' }]);
    };
    const first = runCodeAgent('fix a');
    await vi.waitFor(() => expect(run).toHaveBeenCalled());
    await new Promise(resolve => { setTimeout(resolve, 20); });
    expect(await runCodeAgent('fix b')).toMatchObject({ status: 'error', message: expect.stringContaining('already working') });
    release();
    await first;
  });
});
