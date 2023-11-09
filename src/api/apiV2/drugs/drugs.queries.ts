import { PrismaClient } from '@prisma/client';

const db = new PrismaClient({ log: ['error', 'info', 'query', 'warn'] });

export default {
  getAllDrugs() {
    return db.drug_names.findMany();
  },

  async getDrug(name:string) {
    return db.drug_names.findFirst({
      where: {
        name: name.toUpperCase(),
      },
    });
  },
};
