import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@db/tripbot';

const pool = new Pool({ connectionString: process.env.PRISMA_DB_URL });

const adapter = new PrismaPg(pool);

const prisma: PrismaClient = new PrismaClient({ adapter });

export default prisma;
