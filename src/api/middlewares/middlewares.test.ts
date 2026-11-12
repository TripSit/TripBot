/* eslint-disable no-restricted-syntax, sonarjs/no-duplicate-string */
import type { NextFunction, Request, Response } from 'express';
import keycloakAuth from './keycloakAuth';
import { errorHandler, notFound } from './middlewares';

const mocks = vi.hoisted(() => ({ discordId: vi.fn() }));
vi.mock('../../global/utils/keycloak', () => ({ getDiscordIdFromFederatedIdentity: mocks.discordId }));

const makeRes = (statusCode = 200) => {
  const res = { statusCode, status: vi.fn(function status(this: { statusCode: number }, code: number) { this.statusCode = code; return this; }), json: vi.fn() };
  return res as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
};

describe('notFound / errorHandler', () => {
  it('turns unmatched requests into 404 errors', () => {
    const res = makeRes();
    const next = vi.fn();
    notFound({ originalUrl: '/nope' } as Request, res, next as NextFunction);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next.mock.calls[0][0].message).toBe('Not found - /nope');
  });

  it('keeps an existing error status, defaults 200 to 500, and hides the stack in production', () => {
    const kept = makeRes(404);
    errorHandler(new Error('x'), {} as Request, kept);
    expect(kept.json).toHaveBeenCalledWith(expect.objectContaining({ status: 404, message: 'x' }));
    const defaulted = makeRes(200);
    errorHandler(new Error('y'), {} as Request, defaulted);
    expect(defaulted.json).toHaveBeenCalledWith(expect.objectContaining({ status: 500, stack: expect.stringContaining('Error') }));
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const prod = makeRes();
      errorHandler(new Error('z'), {} as Request, prod);
      expect(prod.json).toHaveBeenCalledWith(expect.objectContaining({ stack: '🥞' }));
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});

describe('keycloakAuth', () => {
  const request = (authorization?: string) => ({ headers: { authorization }, path: '/x' }) as unknown as Parameters<typeof keycloakAuth>[0];

  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('rejects missing or malformed headers', async () => {
    for (const header of [undefined, 'Basic abc']) {
      const res = makeRes();
      const next = vi.fn();
      // eslint-disable-next-line no-await-in-loop
      await keycloakAuth(request(header), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    }
  });

  it('rejects tokens Keycloak does not accept', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 401 });
    const res = makeRes();
    await keycloakAuth(request('Bearer abc'), res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
  });

  it('attaches the user and their Discord id', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ sub: 'kc1' }) });
    mocks.discordId.mockResolvedValueOnce('d1');
    const req = request('Bearer abc');
    const next = vi.fn();
    await keycloakAuth(req, makeRes(), next);
    expect(req.user).toEqual({ sub: 'kc1', discord_id: 'd1' });
    expect(next).toHaveBeenCalled();
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual({ headers: { Authorization: 'Bearer abc' } });
  });

  it('continues without a Discord id when none is linked or lookup fails', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => ({ sub: 'kc1' }) });
    mocks.discordId.mockResolvedValueOnce(null);
    const none = request('Bearer abc');
    await keycloakAuth(none, makeRes(), vi.fn());
    expect(none.user).toEqual({ sub: 'kc1' });
    mocks.discordId.mockRejectedValueOnce(new Error('admin down'));
    const failed = request('Bearer abc');
    const next = vi.fn();
    await keycloakAuth(failed, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 500 on unexpected failures', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));
    const res = makeRes();
    await keycloakAuth(request('Bearer abc'), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
