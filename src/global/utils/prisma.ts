import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({ log: ['error', 'info', 'query', 'warn'] });
export default db;
