import path from 'node:path';
import Knex from 'knex';
import { updateTypes } from 'knex-types';
import knexConfig from './knexfile';

const environment = process.env.NODE_ENV || 'development';
const connectionConfig = knexConfig[environment as 'development' | 'production'];

const knex = Knex(connectionConfig);

updateTypes(knex, { output: path.join(__dirname, 'database.d.ts') }).catch(() => {
  // console.error(err);
  process.exit(1);
});
