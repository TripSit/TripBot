const F = f(__filename);

export default {
  getAllAppeals() {
    return db.appeals.findMany();
  },

  async getAppeals(UserId:string) {
    log.debug(F, `UserId: ${UserId}`);
    if (!UserId || UserId === 'undefined') {
      throw new Error('Invalid user ID provided');
    }
    return db.appeals.findMany({
      where: {
        user_id: UserId,
      },
    });
  },

  async getLatestAppeal(UserId: string) {
    if (!UserId || UserId === 'undefined') {
      throw new Error('Invalid user ID provided');
    }

    return db.appeals.findFirst({
      where: {
        user_id: UserId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  },

  async createAppeal(data: {
    guild_id: string;
    user_id: string;
    reason: string;
    solution: string;
    future: string;
    extra?: string;
    appeal_message_id: string;
  }): Promise<boolean> {
    try {
      // Get the latest appeal to determine the next appeal number
      const latestAppeal = await db.appeals.findFirst({
        where: {
          user_id: data.user_id,
          guild_id: data.guild_id,
        },
        orderBy: {
          created_at: 'desc',
        },
        select: {
          appeal_number: true,
        },
      });

      const newAppealNumber = latestAppeal ? latestAppeal.appeal_number + 1 : 1;

      // Create the new appeal
      await db.appeals.create({
        data: {
          guild_id: data.guild_id,
          user_id: data.user_id,
          appeal_number: newAppealNumber,
          reason: data.reason,
          solution: data.solution,
          future: data.future,
          extra: data.extra,
          status: 'RECEIVED', // Opened, Received, Accepted, Denied
          appeal_message_id: data.appeal_message_id,
        },
      });

      log.info(F, `Appeal #${newAppealNumber} created successfully for user ${data.user_id}`);
      return true;
    } catch (error) {
      log.error(F, `Error creating appeal: ${error}`);
      return false;
    }
  },
};
