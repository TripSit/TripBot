import { beforeEach, vi } from 'vitest';
import '../../global/utils/log';
import '../../global/utils/env.config';
import { dbMock, resetDbMock } from '../utils/mockDb';

// global.rollbar is only assigned in production (see src/global/utils/log.ts);
// log.warn() dereferences it unconditionally unless the message contains 'Missing',
// so tests need a stub or any such warn path throws.
global.rollbar = {
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
} as unknown as typeof global.rollbar;

global.db = dbMock as unknown as typeof global.db;

beforeEach(() => {
  resetDbMock();
});
