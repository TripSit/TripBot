import type { Config } from 'jest';

const jestConfig: Config = {
  testMatch: [
    '**/__tests__/*.spec.ts',
  ],
  testEnvironment: 'node',
  clearMocks: true,
  globalSetup: '<rootDir>/tests/setup.ts',
  transform: {
    '\\.ts$': 'ts-jest',
  },
};

export default jestConfig;
