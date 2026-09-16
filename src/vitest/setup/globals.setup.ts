import { beforeEach, vi } from 'vitest';
import '../../global/utils/env.config';
import '../../global/utils/log';
import { dbMock, resetDbMock } from '../utils/mockDb';

// global.rollbar is only assigned in production (see src/global/utils/log.ts); stub it so
// tests can assert on what log.warn() forwards to it.
global.rollbar = {
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
} as unknown as typeof global.rollbar;

global.db = dbMock as unknown as typeof global.db;

beforeEach(() => {
  resetDbMock();
});
