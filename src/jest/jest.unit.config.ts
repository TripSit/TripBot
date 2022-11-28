import type { Config } from 'jest';

const jestConfig: Config = {
  testMatch: [
    '**/__tests__/*.test.ts',
  ],
  testEnvironment: 'node',
  clearMocks: true,
  transform: {
    '\\.ts$': 'ts-jest',
  },
};

export default jestConfig;
