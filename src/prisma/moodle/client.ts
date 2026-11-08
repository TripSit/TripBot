import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@db/moodle';

// The adapter handles the connection pool internally. Adapter 7.10+ throws at construction when given undefined,
// so an unset URL becomes an empty string: queries then fail on use (callers handle an unreachable Moodle).
const adapter = new PrismaMariaDb(process.env.MOODLE_DB_URL ?? '');

const moodlePrisma = new PrismaClient({ adapter });

export default moodlePrisma;
