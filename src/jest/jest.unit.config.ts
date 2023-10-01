import type { Config } from 'jest';

const jestConfig: Config = {
  setupFilesAfterEnv: [
    '<rootDir>/src/global/utils/log.ts',
    '<rootDir>/src/global/utils/env.config.ts',
  ],
  testMatch: [
    '<rootDir>/src/jest/__tests__/*.test.ts',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    './src/discord/**/*',
    './src/global/**/*',
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
    '<rootDir>/src/discord/commands/index.ts',
    '<rootDir>/src/discord/commands/archive/*',
    '<rootDir>/src/discord/commands/global/_d.globalTemplate.ts',
    '<rootDir>/src/discord/commands/guild/_d.guildTemplate.ts',
  ],
  testEnvironment: 'node',
  clearMocks: true,
  transform: {
    '\\.ts$': 'ts-jest',
  },
  rootDir: '../../',
};

export default jestConfig;
