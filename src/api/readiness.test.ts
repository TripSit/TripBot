import { Request, Response } from 'express';
import supertest from 'supertest';
import { dbMock } from '../vitest/utils/mockDb';
import { readiness } from './readiness.routes';

const mocks = vi.hoisted(() => ({ healthy: vi.fn(() => true) }));
vi.mock('../global/utils/heartbeat', async importOriginal => ({
  ...(await importOriginal<object>()), isHealthy: mocks.healthy,
}));

const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

function responseMock() {
  const response = { set: vi.fn(), status: vi.fn().mockReturnThis(), json: vi.fn() };
  return { response, run: () => readiness({} as Request, response as unknown as Response) };
}

beforeEach(() => {
  global.db = dbMock;
  mocks.healthy.mockReturnValue(true);
  dbMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
});

afterEach(() => {
  global.db = dbMock;
  vi.useRealTimers();
});

it('answers the mounted health endpoint without exposing connection details', async () => {
  const { default: app } = await import('./app');
  const result = await supertest(app).get('/api/health');
  expect(result.status).toBe(200);
  expect(result.body).toEqual({ ready: true });
  expect(result.headers['cache-control']).toBe('no-store');
  expect(result.headers['x-content-type-options']).toBe('nosniff');
  expect(dbMock.$queryRaw).toHaveBeenCalledWith(['SELECT 1']);
});

it.each(['missing database', 'disconnected bot'])('is unavailable with a %s', async reason => {
  if (reason === 'missing database') global.db = undefined as unknown as typeof global.db;
  else mocks.healthy.mockReturnValue(false);
  const { response, run } = responseMock();
  await run();
  expect(response.status).toHaveBeenCalledWith(503);
  expect(response.json).toHaveBeenCalledWith({ ready: false });
  expect(dbMock.$queryRaw).not.toHaveBeenCalled();
});

it('hides database failure details and recovers on the next probe', async () => {
  dbMock.$queryRaw.mockRejectedValueOnce(new Error('sensitive connection details'));
  const { response, run } = responseMock();
  await run();
  expect(response.status).toHaveBeenLastCalledWith(503);
  expect(response.json).toHaveBeenLastCalledWith({ ready: false });
  await run();
  expect(response.status).toHaveBeenLastCalledWith(200);
  expect(dbMock.$queryRaw).toHaveBeenCalledTimes(2);
});

it('rechecks bot connections after querying the database', async () => {
  mocks.healthy.mockReturnValueOnce(true).mockReturnValueOnce(false);
  const { response, run } = responseMock();
  await run();
  expect(response.status).toHaveBeenCalledWith(503);
});

it('bounds stalled probes and shares the query until it settles', async () => {
  vi.useFakeTimers();
  let release!: (value: unknown[]) => void;
  dbMock.$queryRaw.mockReturnValueOnce(new Promise(resolve => { release = resolve; }) as never);
  const first = responseMock();
  const second = responseMock();
  const checks = [first.run(), second.run()];
  await vi.advanceTimersByTimeAsync(2000);
  await Promise.all(checks);
  expect(first.response.status).toHaveBeenCalledWith(503);
  expect(second.response.status).toHaveBeenCalledWith(503);
  expect(dbMock.$queryRaw).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);

  const third = responseMock();
  const retry = third.run();
  expect(dbMock.$queryRaw).toHaveBeenCalledTimes(1);
  release([]);
  await retry;
  expect(third.response.status).toHaveBeenCalledWith(200);
  await flush();
  await responseMock().run();
  expect(dbMock.$queryRaw).toHaveBeenCalledTimes(2);
});
