import { beforeEach } from 'vitest';
import '../../global/utils/env.config';
import '../../global/utils/log';
import { dbMock, resetDbMock } from '../utils/mockDb';

global.db = dbMock as unknown as typeof global.db;

beforeEach(() => {
  resetDbMock();
});

// start.ts publishes commandContext as a global; d.* commands call it unqualified.
(global as unknown as { commandContext: unknown }).commandContext = vi.fn(async () => 'ctx');
