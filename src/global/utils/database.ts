import createConnectionPool, {sql} from '@databases/pg';
import env from './env.config';

// https://www.atdatabases.org/docs/pg

export {sql};
const db = createConnectionPool(env.POSTGRES_DBURL);
export default db;
