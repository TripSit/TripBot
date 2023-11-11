import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({ log: ['error'] });
const F = f(__filename);

export default {
  getAllAppeals() {
    return db.appeals.findMany();
  },

  async getAppeals(UserId:string) {
    log.debug(F, `UserId: ${UserId}`);
    return db.appeals.findMany({
      where: {
        user_id: UserId,
      },
    });
  },

  async getLatestAppeal(UserId:string) {
    return db.appeals.findFirst({
      where: {
        user_id: UserId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  },
};
