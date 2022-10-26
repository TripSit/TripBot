import env from './env.config';
import knex from 'knex';

export const db = knex({
  client: 'pg',
  connection: env.POSTGRES_DBURL,
});
