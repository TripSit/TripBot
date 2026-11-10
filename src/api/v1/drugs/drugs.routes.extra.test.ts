/* eslint-disable sonarjs/no-duplicate-string */
import express from 'express';
import supertest from 'supertest';

// The real limiter allows five requests a minute per router; this suite makes many.
vi.mock('express-rate-limit', () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const mocks = vi.hoisted(() => ({
  queries: {
    getInteraction: vi.fn(),
    getDrug: vi.fn(),
    getAllDrugNames: vi.fn(),
    getAllDrugNamesByCategory: vi.fn(),
    getAllDrugs: vi.fn(),
    getAllCategories: vi.fn(),
    getAllDrugAliases: vi.fn(),
  },
}));
vi.mock('./drugs.queries', () => ({ default: mocks.queries }));

// eslint-disable-next-line import/first
import router from './drugs.routes';

const app = express();
app.use('/', router);
app.use((_req, res) => { res.status(404).json({ notFound: true }); });
app.use((_err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  res.status(500).json({ error: true });
});

describe('drugs routes', () => {
  beforeEach(() => { Object.values(mocks.queries).forEach(q => q.mockReset()); });

  it.each([
    ['/getInteraction', 'input'],
    ['/getDrug', 'input'],
    ['/getAllDrugNamesByCategory', 'endpoint'],
  ])('%s documents its usage', async (path, key) => {
    const res = await supertest(app).get(path).expect(200);
    expect(res.body).toHaveProperty(key);
  });

  it.each([
    ['/getInteraction/a/b', 'getInteraction'],
    ['/getDrug/a', 'getDrug'],
    ['/getAllDrugNames', 'getAllDrugNames'],
    ['/getAllDrugNamesByCategory/stim', 'getAllDrugNamesByCategory'],
    ['/getAllDrugs', 'getAllDrugs'],
    ['/getAllCategories', 'getAllCategories'],
    ['/getAllDrugAliases', 'getAllDrugAliases'],
  ] as const)('%s wraps the query result', async (path, query) => {
    mocks.queries[query].mockResolvedValue({ ok: true });
    const res = await supertest(app).get(path).expect(200);
    expect(res.body).toEqual({ err: null, data: [{ ok: true }] });
  });

  it.each([
    ['/getInteraction/a/b', 'getInteraction'],
    ['/getDrug/a', 'getDrug'],
    ['/getAllDrugNames', 'getAllDrugNames'],
    ['/getAllDrugNamesByCategory/stim', 'getAllDrugNamesByCategory'],
    ['/getAllDrugs', 'getAllDrugs'],
    ['/getAllCategories', 'getAllCategories'],
    ['/getAllDrugAliases', 'getAllDrugAliases'],
  ] as const)('%s falls through to 404 when nothing is found and 500 on errors', async (path, query) => {
    mocks.queries[query].mockResolvedValueOnce(null);
    await supertest(app).get(path).expect(404);
    mocks.queries[query].mockRejectedValueOnce(new Error('db'));
    await supertest(app).get(path).expect(500);
  });

  it.each([
    '/getInteraction/error/b', '/getInteraction/a/error', '/getDrug/error', '/getAllDrugNamesByCategory/error',
  ])('%s rejects the sentinel "error" input', async path => {
    await supertest(app).get(path).expect(500);
  });
});
