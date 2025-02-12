import {
  TextChannel,
  Message,
  User,
} from 'discord.js';

const F = f(__filename);

interface WatchRequest {
  notification_method: string;
  channel_id: string | null;
  caller_id: string;
  watched_user_id: string;
}

type DbWatchRequest = {
  id?: string;
  notification_method: string;
  channel_id: string | null;
  caller_id: string;
  watched_user_id: string;
  usersId?: string;
};

export async function dbAddWatchRequest(
  targetUserId: string,
  watchRequests: WatchRequest[],
) {
  const existingUser = await db.users.findUnique({
    where: {
      discord_id: targetUserId,
    },
    include: {
      watch_requests: true,
    },
  });

  if (existingUser) {
    // Add new watch requests to the existing user's watch_requests array
    const latestRequest = watchRequests[watchRequests.length - 1];

    // We can also do the same thing by adding these directly to watch_requests on the User table.
    return db.watch_request.create({
      data: {
        notification_method: latestRequest.notification_method,
        channel_id: latestRequest.channel_id,
        caller_id: latestRequest.caller_id,
        watched_user_id: latestRequest.watched_user_id,
        usersId: existingUser.id,
      },
    });
  }
  // User not found
  throw new Error(`User with ID ${targetUserId} not found.`);
}

export async function dbDeleteWatchRequest(targetUserId: string, callerId: string): Promise<void> {
  const user = await db.users.findUnique({
    where: { discord_id: targetUserId },
    include: { watch_requests: true },
  });

  if (!user) {
    log.info(F, `User with ID ${targetUserId} does not exist.`);
    return;
  }

  const watchRequests = user.watch_requests as DbWatchRequest[];

  // Find and delete the request related to the caller
  const requestToDelete = watchRequests.find(watchRequestObj => watchRequestObj.caller_id === callerId);
  if (requestToDelete) {
    await db.watch_request.delete({
      where: { id: requestToDelete.id },
    });
  } else {
    log.info(F, `No watch request found for caller ${callerId}.`);
  }
}

export async function deleteWatchRequest(targetUserId: string, callerId: string): Promise<boolean> {
  const user = await db.users.findUnique({
    where: { discord_id: targetUserId },
    include: { watch_requests: true },
  });

  if (!user) {
    return false; // User not found
  }

  const watchRequests = user.watch_requests;

  // Find the index of the watch request to delete
  const indexToDelete = watchRequests.findIndex(watchRequestObj => watchRequestObj.caller_id === callerId);
  if (indexToDelete === -1) {
    return false; // WatchRequest with callerId not found
  }
  // Delete the watch request from the array
  watchRequests.splice(indexToDelete, 1);

  await dbDeleteWatchRequest(targetUserId, callerId);
  return true; // Successfully deleted the watchRequest
}

export async function nightsWatch(message: Message) {
  const user = await db.users.findUnique({
    where: { discord_id: message.author.id },
    include: { watch_requests: true },
  });

  if (!user || !message.guild) return;

  const watchRequests = user.watch_requests;

  if (watchRequests.length === 0) {
    return;
  }

  watchRequests.forEach(async watchRequestObj => {
    const target = await message.client.users.fetch(user.discord_id as string) as User;

    if (watchRequestObj.notification_method === 'dm') {
      const caller = await message.client.users.fetch(watchRequestObj.caller_id);
      if (caller) {
        try {
          await caller.send(
            `Hey ${caller}, the user ${target} which you were watching has been active recently in ${message.channel}.`,
          );
        } catch (err) {
          log.info(F, 'Failed to fulfill Watch Request. Likely can\'t DM user.');
        }

        await deleteWatchRequest(user.discord_id as string, caller.id);
      }
    } else if (watchRequestObj.notification_method === 'channel') {
      const tripsitGuild = await message.client.guilds.fetch(env.DISCORD_GUILD_ID);
      if (watchRequestObj.channel_id) {
        // eslint-disable-next-line max-len
        const notificationChannel = await tripsitGuild.channels.fetch(watchRequestObj.channel_id as string) as TextChannel;
        const caller = await message.client.users.fetch(watchRequestObj.caller_id) as User;
        try {
          await notificationChannel.send(
            `Hey ${caller}, the user ${target} which you were watching has been active recently in ${message.channel}.`,
          );
        } catch (err) {
          log.info(F, 'Failed to fulfill Watch Request. Notification sending failed.');
        }
        await deleteWatchRequest(user.discord_id as string, caller.id);
      }
    }
  });
}

export async function executeWatch(
  target: User,
  notificationMethod: string,
  callerId: string,
  alertChannel: TextChannel | null = null,
): Promise<boolean> {
  const user = await db.users.findUnique({
    where: { discord_id: target.id },
    include: { watch_requests: true },
  });

  if (user) {
    const watchRequests = user.watch_requests;

    // Check for duplicate request using array iteration
    const duplicateRequest = watchRequests.some(watchRequestObj => watchRequestObj.caller_id === callerId);

    if (duplicateRequest) {
      log.info(F, `Duplicate watch request found for callerId: ${callerId}`);
      return false;
    }

    // Add the new watch request
    watchRequests.push({
      id: '',
      usersId: null,
      notification_method: notificationMethod,
      channel_id: alertChannel ? alertChannel.id : null,
      caller_id: callerId,
      watched_user_id: target.id,
    });
    await dbAddWatchRequest(target.id, watchRequests);
    log.info(F, `New watch request added for callerId: ${callerId}`);
    return true;
  }

  // If user does not exist, return false
  log.info(F, `User ${target.id} not found.`);
  return false;
}
