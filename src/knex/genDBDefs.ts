import path from 'node:path';
import Knex from 'knex';
import { updateTypes } from 'knex-types';
import knexConfig from './knexfile';

const knex = Knex(knexConfig);

updateTypes(knex, { output: path.join(__dirname, 'database.d.ts') }).catch(() => {
  // console.error(err);
  process.exit(1);
});
