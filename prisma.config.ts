import { defineConfig } from 'prisma/config';

// Determine which DB we are configuring for
const isMoodle = process.env.PRISMA_SCHEMA === 'moodle';

export default defineConfig({
  // Point to the correct schema file
  migrations: {
    path: 'src/prisma/tripbot/migrations',
    seed: 'tsx src/prisma/seed.ts',
  },
  schema: isMoodle
    ? './src/prisma/moodle/schema.prisma'
    : './src/prisma/tripbot/schema.prisma',
  datasource: {
    // Switch the URL based on the target
    url: isMoodle
      ? process.env.MOODLE_DB_URL
      : process.env.PRISMA_DB_URL,
  },
});
