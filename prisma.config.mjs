// @ts-nocheck
/* eslint-disable */
import { defineConfig } from 'prisma/config';

const isMoodle = process.env.PRISMA_SCHEMA === 'moodle';
export default defineConfig({
  migrations: {
    path: 'src/prisma/tripbot/migrations',
    seed: 'tsx src/prisma/seed.ts',
  },
  schema: isMoodle
    ? './src/prisma/moodle/schema.prisma'
    : './src/prisma/tripbot/schema.prisma',
  datasource: {
    url: isMoodle
      ? process.env.MOODLE_DB_URL
      : process.env.PRISMA_DB_URL,
  },
});
