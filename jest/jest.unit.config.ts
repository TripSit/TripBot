import type { Config } from 'jest';

const jestConfig: Config = {
  testMatch: [
    '<rootDir>/src/**/__tests__/*.test.ts',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    './src/**/*',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/start.ts',
    '<rootDir>/src/global/@types/*',
    '<rootDir>/src/global/utils/*',
    '<rootDir>/src/global/assets/*',
    '<rootDir>/src/global/commands/index.ts',
    '<rootDir>/src/global/commands/_g.template.ts',
    '<rootDir>/src/global/commands/archive/*',
    '<rootDir>/src/discord/utils/*',
    '<rootDir>/src/discord/events/*',
    '<rootDir>/src/discord/dscrd.ts',
    '<rootDir>/src/discord/__tests*/*',
    '<rootDir>/src/discord/commands/index.ts',
    '<rootDir>/src/discord/commands/archive/*',
    '<rootDir>/src/discord/commands/global/_d.globalTemplate.ts',
    '<rootDir>/src/discord/commands/discord/_d.discordTemplate.ts',

  ],
  testEnvironment: 'node',
  clearMocks: true,
  transform: {
    '\\.ts$': 'ts-jest',
  },
  rootDir: '../',
};

export default jestConfig;
