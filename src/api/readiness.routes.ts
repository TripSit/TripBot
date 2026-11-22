import { Request, Response, Router } from 'express';
import { isHealthy } from '../global/utils/heartbeat';

const DATABASE_TIMEOUT_MS = 2000;
let pendingQuery: Promise<boolean> | undefined;

async function databaseReady(): Promise<boolean> {
  // Share a stalled query so repeated probes cannot exhaust the database pool.
  pendingQuery ??= db.$queryRaw`SELECT 1`
    .then(() => true, () => false)
    .finally(() => { pendingQuery = undefined; });
  let timeout: NodeJS.Timeout | undefined;
  const expired = new Promise<boolean>(resolve => {
    timeout = setTimeout(() => resolve(false), DATABASE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([pendingQuery, expired]);
  } finally {
    clearTimeout(timeout);
  }
}

export async function readiness(request: Request, response: Response): Promise<void> {
  response.set('Cache-Control', 'no-store');
  if (!global.db || !isHealthy()) {
    response.status(503).json({ ready: false });
    return;
  }
  const ready = await databaseReady() && isHealthy();
  response.status(ready ? 200 : 503).json({ ready });
}

const router = Router();
router.get('/', readiness);
export default router;
