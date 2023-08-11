import type { Config } from 'jest';

const jestConfig: Config = {
  setupFilesAfterEnv: [
    '<rootDir>/global/utils/log.ts',
    '<rootDir>/global/utils/env.config.ts',
  ],
  testMatch: [
    '<rootDir>/jest/__tests__/*.test.ts',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    './src/discord/**/*',
    './src/global/**/*',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/start.ts',
    '<rootDir>/global/@types/*',
    '<rootDir>/global/utils/*',
    '<rootDir>/global/assets/*',
    '<rootDir>/global/commands/index.ts',
    '<rootDir>/global/commands/_g.template.ts',
    '<rootDir>/global/commands/archive/*',
    '<rootDir>/discord/utils/*',
    '<rootDir>/discord/events/*',
    '<rootDir>/discord/dscrd.ts',
    '<rootDir>/discord/commands/index.ts',
    '<rootDir>/discord/commands/archive/*',
    '<rootDir>/discord/commands/global/_d.globalTemplate.ts',
    '<rootDir>/discord/commands/guild/_d.guildTemplate.ts',
  ],
  testEnvironment: 'node',
  clearMocks: true,
  transform: {
    '\\.ts$': 'ts-jest',
  },
  rootDir: '../',
};

export default jestConfig;
