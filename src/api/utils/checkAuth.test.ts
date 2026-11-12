import type { Request, Response } from 'express';
import checkAuth from './checkAuth';

const basic = Buffer.from('test-user:test-password').toString('base64');

function authorize(authorization?: string) {
  const req = { headers: { authorization } } as Request;
  const send = vi.fn();
  const status = vi.fn().mockReturnValue({ send });
  const res = { status } as unknown as Response;
  return { result: checkAuth(req, res), status, send };
}

describe('checkAuth', () => {
  beforeEach(() => {
    vi.stubGlobal('env', {
      ...env,
      API_USERNAME: 'test-user',
      API_PASSWORD: 'test-password',
      TRIPBOT_API_TOKEN: 'test-token',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    [undefined, 'No authorization header'],
    ['Basic', 'Authorization header is not in the correct format'],
    ['Basic ', 'Authorization header does not have a token'],
    ['Basic wrong', 'Authorization token is not valid'],
    ['Bearer wrong', 'Bearer token is not valid'],
    ['Digest token', 'Unsupported authorization type'],
  ])('rejects invalid credentials (%s)', async (header, message) => {
    const { result, status, send } = authorize(header);
    await expect(result).resolves.toBe(false);
    expect(status).toHaveBeenCalledExactlyOnceWith(401);
    expect(send).toHaveBeenCalledExactlyOnceWith(message);
  });

  it.each([`Basic ${basic}`, 'Bearer test-token'])('accepts valid credentials (%s)', async header => {
    const { result, status, send } = authorize(header);
    await expect(result).resolves.toBe(true);
    expect(status).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('returns 500 when bearer authentication is unconfigured', async () => {
    vi.stubGlobal('env', { ...env, TRIPBOT_API_TOKEN: undefined });
    const { result, status, send } = authorize('Bearer test-token');
    await expect(result).resolves.toBe(false);
    expect(status).toHaveBeenCalledExactlyOnceWith(500);
    expect(send).toHaveBeenCalledExactlyOnceWith('Server authentication misconfigured');
  });
});
