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

  async getLatestAppeal(discordId: string) {
    if (!discordId || discordId === 'undefined') {
      throw new Error('Invalid discord ID provided');
    }

    // First find the user by discord_id to get their UUID
    const user = await db.users.findFirst({
      where: {
        discord_id: discordId,
      },
      select: {
        id: true, // Get the UUID
      },
    });

    if (!user) {
      return null; // User doesn't exist in database
    }

    // Now query appeals using the user's UUID
    return db.appeals.findFirst({
      where: {
        user_id: user.id, // Use the UUID
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  },

  async createAppeal(data: {
    guild_id: string;
    discord_id: string; // Changed from user_id to discord_id
    reason: string;
    solution: string;
    future: string;
    extra?: string;
    appeal_message_id: string;
  }): Promise<boolean> {
    try {
      // First find the user by discord_id to get their UUID
      const user = await db.users.findFirst({
        where: {
          discord_id: data.discord_id,
        },
        select: {
          id: true, // Get the UUID
        },
      });

      if (!user) {
        log.error(F, `User not found in database for discord_id: ${data.discord_id}`);
        return false;
      }

      // Get the latest appeal to determine the next appeal number
      const latestAppeal = await db.appeals.findFirst({
        where: {
          user_id: user.id, // Use the UUID
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
          user_id: user.id, // Use the UUID
          appeal_number: newAppealNumber,
          reason: data.reason,
          solution: data.solution,
          future: data.future,
          extra: data.extra,
          status: 'RECEIVED', // Opened, Received, Accepted, Denied
          appeal_message_id: data.appeal_message_id,
        },
      });

      log.info(F, `Appeal #${newAppealNumber} created successfully for discord_id ${data.discord_id} (user_id: ${user.id})`);
      return true;
    } catch (error) {
      log.error(F, `Error creating appeal: ${error}`);
      return false;
    }
  },
};
