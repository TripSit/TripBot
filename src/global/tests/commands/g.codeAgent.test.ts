import {
  codeAgentDeps, forbiddenChanges, isCodeAgentConfigured, parseCodeAgentRequest, runCodeAgent,
} from '../../commands/g.codeAgent';

const e = env as unknown as Record<string, string | undefined>;
const original = { ...e };

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

describe('runCodeAgent', () => {
  const run = vi.fn();
  const originalDeps = { ...codeAgentDeps };

  beforeEach(() => {
    e.CLAUDE_CODE_OAUTH_TOKEN = 'claude-token';
    e.GITHUB_TOKEN = 'gh-token';
    e.CODE_AGENT_REPO = '/nonexistent-repo';
    run.mockReset();
    run.mockResolvedValue('');
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
