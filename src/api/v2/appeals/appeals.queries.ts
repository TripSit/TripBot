const F = f(__filename);

export default {
  getAllAppeals() {
    return db.appeals.findMany();
  },

  async getAppeals(userId:string) {
    log.debug(F, `UserId: ${userId}`);
    if (!userId || userId === 'undefined') {
      throw new Error('Invalid user ID provided');
    }
    return db.appeals.findMany({
      where: {
        user_id: userId,
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
    discord_id: string;
    reason: string;
    solution: string;
    future: string;
    extra?: string;
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

      // Get the latest appeal within 48 hours. If one exists, we cannot create a new appeal.
      const latestAppeal = await db.appeals.findFirst({
        where: {
          user_id: user.id,
          guild_id: data.guild_id,
          created_at: {
            gte: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (latestAppeal) {
        log.info(F, `User ${data.discord_id} tried to create appeal before 48 hour cooldown`);
        return false;
      }

      // Create the new appeal
      await db.appeals.create({
        data: {
          guild_id: data.guild_id,
          user_id: user.id, // Use the UUID
          reason: data.reason,
          solution: data.solution,
          future: data.future,
          extra: data.extra,
          status: 'RECEIVED', // Received, Accepted, Denied
        },
      });

      log.info(F, `Appeal created successfully for discord_id ${data.discord_id} (user_id: ${user.id})`);
      return true;
    } catch (error) {
      log.error(F, `Error creating appeal: ${error}`);
      return false;
    }
  },
  async remindAppeal(discordId: string) {
    try {
    // Find user by discord_id
      const user = await db.users.findFirst({
        where: { discord_id: discordId },
        select: { id: true },
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Get latest appeal
      const appeal = await db.appeals.findFirst({
        where: {
          user_id: user.id,
          status: 'RECEIVED', // Only pending appeals can be reminded
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (!appeal) {
        return { success: false, message: 'No pending appeal found' };
      }

      // Check if already reminded within 24 hours
      if (appeal.reminded_at) {
        const now = new Date();
        const reminderTime = new Date(appeal.reminded_at);
        const hoursSinceReminder = (now.getTime() - reminderTime.getTime()) / (1000 * 60 * 60);

        if (hoursSinceReminder < 24) {
          const hoursLeft = Math.ceil(24 - hoursSinceReminder);
          return {
            success: false,
            message: `You can send another reminder in ${hoursLeft} hours`,
          };
        }
      }

      // Update reminded_at timestamp
      await db.appeals.update({
        where: { id: appeal.id },
        data: { reminded_at: new Date() },
      });

      log.info(F, `Appeal reminder sent for discord_id ${discordId}, appeal_id ${appeal.id}`);

      // TODO: Add your ping logic here
      // await pingModerators(appeal);

      return {
        success: true,
        message: 'Reminder sent to moderators',
      };
    } catch (error) {
      log.error(F, `Error reminding appeal: ${error}`);
      return { success: false, message: 'Internal error' };
    }
  },
};
