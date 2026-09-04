import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@db/moodle';

// The adapter handles the connection pool internally
const adapter = new PrismaMariaDb(process.env.MOODLE_DB_URL!);

const moodlePrisma = new PrismaClient({ adapter });

export default moodlePrisma;
