import type { Request, Response } from 'express';
import checkAuth from './utils/checkAuth';

const e = env as unknown as Record<string, string | undefined>;
const original = { ...e };

function run(authorization?: string) {
  const res = { status: vi.fn(), send: vi.fn() };
  res.status.mockReturnValue(res);
  const req = { headers: { authorization } } as unknown as Request;
  return checkAuth(req, res as unknown as Response).then(ok => ({ ok, res }));
}

const basic = (user: string, password: string) => {
  const encoded = Buffer.from(`${user}:${password}`).toString('base64');
  return `Basic ${encoded}`;
};

beforeEach(() => {
  e.API_USERNAME = 'api-user';
  e.API_PASSWORD = 'api-secret';
  e.TRIPBOT_API_TOKEN = 'bearer-secret';
  vi.spyOn(global.log, 'error').mockReturnValue(undefined as never);
});

afterEach(() => {
  e.API_USERNAME = original.API_USERNAME;
  e.API_PASSWORD = original.API_PASSWORD;
  e.TRIPBOT_API_TOKEN = original.TRIPBOT_API_TOKEN;
  vi.restoreAllMocks();
});

describe('checkAuth header shape', () => {
  it.each([
    [undefined, 'No authorization header'],
    ['Bearer', 'not in the correct format'],
    ['Bearer a b', 'not in the correct format'],
    ['Bearer ', 'does not have a token'],
    ['Digest abc', 'Unsupported authorization type'],
  ])('rejects %j with 401', async (header, message) => {
    const { ok, res } = await run(header);
    expect(ok).toBe(false);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining(message));
  });
});

describe('checkAuth Basic', () => {
  it('accepts the configured username and password', async () => {
    const { ok, res } = await run(basic('api-user', 'api-secret'));
    expect(ok).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each([
    ['a wrong password of the same length', basic('api-user', 'api-secreX')],
    ['a wrong password of another length', basic('api-user', 'short')],
  ])('rejects %s', async (_name, header) => {
    const { ok, res } = await run(header);
    expect(ok).toBe(false);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('answers 500, not success, when the server has no credentials configured', async () => {
    e.API_PASSWORD = undefined;
    const { ok, res } = await run(basic('api-user', ''));
    expect(ok).toBe(false);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('checkAuth Bearer', () => {
  it('accepts the configured token', async () => {
    expect((await run('Bearer bearer-secret')).ok).toBe(true);
  });

  it.each(['bearer-secreX', 'bearer-secret-longer', 'x'])('rejects the wrong token %s', async token => {
    const { ok, res } = await run(`Bearer ${token}`);
    expect(ok).toBe(false);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('answers 500, not success, when the token is not configured', async () => {
    e.TRIPBOT_API_TOKEN = undefined;
    const { ok, res } = await run('Bearer anything');
    expect(ok).toBe(false);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
