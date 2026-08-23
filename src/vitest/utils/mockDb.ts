import { PrismaClient } from '@db/tripbot';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

export const dbMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

export function resetDbMock(): void {
  mockReset(dbMock);
}
