import { beforeEach } from 'vitest';
import '../../global/utils/env.config';
import '../../global/utils/log';
import { dbMock, resetDbMock } from '../utils/mockDb';

global.db = dbMock as unknown as typeof global.db;

beforeEach(() => {
  resetDbMock();
});
