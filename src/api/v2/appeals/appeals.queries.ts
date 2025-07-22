const F = f(__filename);

export default {
  async getAllAppeals() {
    return db.appeals.findMany();
  },

  async getAppeals(UserId: string) {
    log.debug(F, `UserId: ${UserId}`);
    return db.appeals.findMany({
      where: {
        user_id: UserId,
      },
    });
  },

  async getLatestAppeal(UserId: string) {
    return db.appeals.findFirst({
      orderBy: {
        created_at: 'desc',
      },
      where: {
        user_id: UserId,
      },
    });
  },
};
