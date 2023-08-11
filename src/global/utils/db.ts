// import knex from 'knex';

// import knexConfig from './knexfile';

// const environment = process.env.NODE_ENV || 'development';
// const connectionConfig = knexConfig[environment as 'development' | 'production'];

// const connection = knex(connectionConfig);

// export default connection;

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({ log: ['error', 'info', 'query', 'warn'] });
export default db;
