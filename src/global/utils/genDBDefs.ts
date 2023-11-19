import path from 'path';
import Knex from 'knex';
import { updateTypes } from 'knex-types';

const knex = Knex({
  client: 'pg',
  connection: process.env.POSTGRES_DB_URL,
});

updateTypes(knex, { output: path.join(__dirname, '../@types/database.d.ts') }).catch(() => {
  // console.error(err);
  process.exit(1);
});

export default updateTypes;
