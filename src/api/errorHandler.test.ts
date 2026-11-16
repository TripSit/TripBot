import express from 'express';
import supertest from 'supertest';
import { errorHandler, notFound } from './middlewares/middlewares';

// Regression test for TripSit/TripBot#1334: Express skips error handlers that do not declare four arguments.
describe('API error handling', () => {
  const buildApp = () => {
    const app = express();
    app.get('/boom', () => { throw new Error('kaboom'); });
    app.get('/teapot', (_req, _res, next) => {
      next(Object.assign(new Error('short and stout'), { status: 418 }));
    });
    app.use(notFound);
    app.use(errorHandler);
    return app;
  };

  it('declares the four arguments Express needs to dispatch errors to it', () => {
    expect(errorHandler).toHaveLength(4);
  });

  it('answers unknown routes with the JSON 404 shape', async () => {
    const response = await supertest(buildApp()).get('/nope');
    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toMatchObject({ status: 404, message: 'Not found - /nope' });
    expect(response.body.stack).toEqual(expect.any(String));
  });

  it('answers thrown errors with a JSON 500', async () => {
    const response = await supertest(buildApp()).get('/boom');
    expect(response.status).toBe(500);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toMatchObject({ status: 500, message: 'kaboom' });
  });

  it('keeps the HTTP status an error carries', async () => {
    const response = await supertest(buildApp()).get('/teapot');
    expect(response.status).toBe(418);
    expect(response.body).toMatchObject({ status: 418, message: 'short and stout' });
  });

  it('keeps the status when a body parser rejects malformed JSON', async () => {
    const app = express();
    app.use(express.json());
    app.post('/echo', (req, res) => { res.json(req.body); });
    app.use(notFound);
    app.use(errorHandler);
    const response = await supertest(app).post('/echo').set('Content-Type', 'application/json').send('{bad');
    expect(response.status).toBe(400);
    expect(response.body.status).toBe(400);
  });

  it('hides the stack in production', async () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const response = await supertest(buildApp()).get('/boom');
      expect(response.body.stack).toBe('🥞');
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  it('hands the error to Express when the response has already started', () => {
    const error = new Error('late failure');
    const res = { headersSent: true, status: vi.fn(), json: vi.fn() };
    const next = vi.fn();
    errorHandler(error, {} as never, res as never, next);
    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});
