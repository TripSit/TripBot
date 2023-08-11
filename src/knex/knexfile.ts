import { knexSnakeCaseMappers } from 'objection';

export default {
  ...knexSnakeCaseMappers(),
  client: 'pg',
  connection: process.env.POSTGRES_DB_URL,
  migrations: {
    extension: 'ts',
    directory: './migrations',
  },
  seeds: {
    extension: 'ts',
    directory: './seeds',
  },
};
