/* eslint-disable sonarjs/no-duplicate-string */
import supertest from 'supertest';
import type { Server } from 'http';

describe('API app middleware', () => {
  it('reflects allowed origins with credentials, and sets CORS headers for any origin', async () => {
    const { default: app } = await import('./app');
    const allowed = await supertest(app).get('/api').set('Origin', 'https://tripsit.me');
    expect(allowed.headers['access-control-allow-origin']).toBe('https://tripsit.me');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    expect(allowed.headers['access-control-allow-methods']).toContain('OPTIONS');

    const other = await supertest(app).get('/api').set('Origin', 'https://evil.example');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
    expect(other.headers['access-control-allow-headers']).toContain('Authorization');

    const none = await supertest(app).get('/api');
    expect(none.headers['access-control-allow-methods']).toBeUndefined();
  });

  it('answers preflight requests directly', async () => {
    const { default: app } = await import('./app');
    const response = await supertest(app).options('/api/drugs').set('Origin', 'https://tripsit.me');
    expect(response.status).toBe(200);
  });

  it('reports the caller address', async () => {
    const { default: app } = await import('./app');
    const response = await supertest(app).get('/api/ip');
    expect(response.status).toBe(200);
    expect(response.text).toBeTruthy();
  });

  it('rate limits callers after 120 requests a minute', async () => {
    const { default: app } = await import('./app');
    const server = app.listen(0);
    const agent = supertest(server);
    const caller = '192.0.2.120';
    try {
      const responses = await Promise.all(Array.from({ length: 120 }, () => agent.get('/api/ip')
        .set('X-Forwarded-For', caller)));
      expect(responses.every(response => response.status === 200)).toBe(true);
      const limited = await agent.get('/api/ip').set('X-Forwarded-For', caller);
      expect(limited.status).toBe(429);
      expect(limited.text).toContain('Too many requests');
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close(err => (err ? reject(err) : resolve()));
      });
    }
  });
});

describe('api() startup failure', () => {
  it('rejects when the port is already taken', async () => {
    const original = env.API_PORT;
    env.API_PORT = 18439;
    vi.resetModules();
    const { default: api } = await import('./api');
    let first: Server | undefined;
    try {
      first = await api();
      await expect(api()).rejects.toThrow(/EADDRINUSE|address already in use/);
    } finally {
      first?.close();
      env.API_PORT = original;
    }
  });
});
