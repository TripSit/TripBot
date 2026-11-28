import { DiscordAPIError } from 'discord.js';
import fileErrorIssue, {
  errorFingerprint,
  isReportableError,
  sanitizeForIssue,
} from '../../utils/errorIssue';

const mocks = vi.hoisted(() => ({
  search: vi.fn(),
  create: vi.fn(),
  createComment: vi.fn(),
}));

vi.mock('octokit', () => ({
  Octokit: class {
    rest = {
      search: { issuesAndPullRequests: mocks.search },
      issues: { create: mocks.create, createComment: mocks.createComment },
    };
  },
}));

const originalEnv = env.NODE_ENV;
const originalToken = env.GITHUB_TOKEN;
let counter = 0;
// A distinct stack per test so fingerprints and the module's limiters never collide
const uniqueError = () => {
  counter += 1;
  const err = new Error(`boom ${counter}`);
  err.stack = `Error: boom ${counter}\n    at fn${counter} (/app/src/a${counter}.ts:1:1)\n    at b (/app/src/b.ts:2:2)`;
  return err;
};

beforeEach(() => {
  env.NODE_ENV = 'production';
  env.GITHUB_TOKEN = 'token';
  vi.spyOn(console, 'error').mockImplementation(() => {});
  mocks.search.mockResolvedValue({ data: { items: [] } });
  mocks.create.mockResolvedValue({ data: { number: 9 } });
});

afterEach(() => {
  env.NODE_ENV = originalEnv;
  env.GITHUB_TOKEN = originalToken;
  vi.restoreAllMocks();
  Object.values(mocks).forEach(m => m.mockReset());
});

describe('sanitizeForIssue', () => {
  it('redacts ids, emails, tokens and home paths', () => {
    const out = sanitizeForIssue(
      `user 123456789012345678 a@b.com ghp_abcDEF123 at /home/erich/x.ts ${
        ['MTIzNDU2Nzg5MDEyMzQ1Njc4', 'GabCdE', 'abcdefghijklmnopqrstuvwxyz1'].join('.')}`,
    );
    expect(out).not.toMatch(/123456789012345678|a@b\.com|ghp_|erich|GabCdE/);
    expect(out).toContain('<id>');
    expect(out).toContain('/<home>/x.ts');
  });
});

describe('isReportableError', () => {
  it('skips network failures and ignorable Discord errors', () => {
    expect(isReportableError(Object.assign(new Error('x'), { code: 'ENOTFOUND' }))).toBe(false);
    const unknownInteraction = new DiscordAPIError({ message: 'x', code: 10062 }, 10062, 404, 'get', '/x', {} as never);
    expect(isReportableError(unknownInteraction)).toBe(false);
    const server = new DiscordAPIError({ message: 'x', code: 0 }, 0, 503, 'get', '/x', {} as never);
    expect(isReportableError(server)).toBe(false);
  });

  it('reports ordinary errors', () => {
    expect(isReportableError(new TypeError('x'))).toBe(true);
  });
});

describe('errorFingerprint', () => {
  it('is stable across ids in the message and differs across frames', () => {
    const a = new Error('a 123456789012345678');
    a.stack = 'Error: a 123456789012345678\n    at f (/x.ts:1:1)';
    const b = new Error('a 987654321098765432');
    b.stack = 'Error: a 987654321098765432\n    at f (/x.ts:1:1)';
    const c = new Error('a');
    c.stack = 'Error: a\n    at g (/y.ts:1:1)';
    expect(errorFingerprint(a, a.stack)).toBe(errorFingerprint(b, b.stack));
    expect(errorFingerprint(a, a.stack)).not.toBe(errorFingerprint(c, c.stack));
  });
});

describe('fileErrorIssue', () => {
  it('does nothing outside production or without a token', async () => {
    env.NODE_ENV = 'development';
    await fileErrorIssue(uniqueError(), 'x');
    env.NODE_ENV = 'production';
    env.GITHUB_TOKEN = undefined;
    await fileErrorIssue(uniqueError(), 'x');
    expect(mocks.search).not.toHaveBeenCalled();
  });

  it('creates a labelled, sanitized issue for a new error', async () => {
    const err = uniqueError();
    await fileErrorIssue(err, `${err.stack} user 123456789012345678`, 'ping');
    expect(mocks.create).toHaveBeenCalledTimes(1);
    const arg = mocks.create.mock.calls[0][0];
    expect(arg.title).toMatch(/^\[bot-error\] Error: boom/);
    expect(arg.labels).toContain('bot-error');
    expect(arg.body).toContain('/ping');
    expect(arg.body).not.toContain('123456789012345678');
  });

  it('comments instead of creating a duplicate', async () => {
    mocks.search.mockResolvedValue({ data: { items: [{ number: 4 }] } });
    const err = uniqueError();
    await fileErrorIssue(err, err.stack as string);
    await fileErrorIssue(err, err.stack as string);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.createComment).toHaveBeenCalledTimes(1);
    expect(mocks.createComment).toHaveBeenCalledWith(expect.objectContaining({ issue_number: 4 }));
  });

  it('skips errors that are not worth an issue', async () => {
    await fileErrorIssue(Object.assign(new Error('x'), { code: 'ENOTFOUND' }), 'x');
    expect(mocks.search).not.toHaveBeenCalled();
  });

  it('never throws when GitHub fails', async () => {
    mocks.search.mockRejectedValue(new Error('github down'));
    const err = uniqueError();
    await expect(fileErrorIssue(err, err.stack as string)).resolves.toBeUndefined();
  });

  it('caps new issues per hour', async () => {
    await Promise.all([1, 2, 3, 4, 5].map(() => {
      const err = uniqueError();
      return fileErrorIssue(err, err.stack as string);
    }));
    expect(mocks.create.mock.calls.length).toBeLessThanOrEqual(3);
  });
});
