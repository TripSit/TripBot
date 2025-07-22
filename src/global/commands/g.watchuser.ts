import type { Message, TextChannel, User } from 'discord.js';

const F = f(__filename);

interface DatabaseWatchRequest {
  caller_id: string;
  channel_id: null | string;
  id?: string;
  notification_method: string;
  usersId?: string;
  watched_user_id: string;
}

interface WatchRequest {
  caller_id: string;
  channel_id: null | string;
  notification_method: string;
  watched_user_id: string;
}

export async function dbAddWatchRequest(targetUserId: string, watchRequests: WatchRequest[]) {
  const existingUser = await db.users.findUnique({
    include: {
      watch_requests: true,
    },
    where: {
      discord_id: targetUserId,
    },
  });

  if (existingUser) {
    // Add new watch requests to the existing user's watch_requests array
    const latestRequest = watchRequests.at(-1);
    if (!latestRequest) {
      throw new Error(`No latest request found for user ${targetUserId}.`);
    }

    // We can also do the same thing by adding these directly to watch_requests on the User table.
    return db.watch_request.create({
      data: {
        caller_id: latestRequest.caller_id,
        channel_id: latestRequest.channel_id,
        notification_method: latestRequest.notification_method,
        usersId: existingUser.id,
        watched_user_id: latestRequest.watched_user_id,
      },
    });
  }
  // User not found
  throw new Error(`User with ID ${targetUserId} not found.`);
}

export async function dbDeleteWatchRequest(targetUserId: string, callerId: string): Promise<void> {
  const user = await db.users.findUnique({
    include: { watch_requests: true },
    where: { discord_id: targetUserId },
  });

  if (!user) {
    log.info(F, `User with ID ${targetUserId} does not exist.`);
    return;
  }

  const watchRequests = user.watch_requests as DatabaseWatchRequest[];

  // Find and delete the request related to the caller
  const requestToDelete = watchRequests.find(
    (watchRequestObject) => watchRequestObject.caller_id === callerId,
  );
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
    include: { watch_requests: true },
    where: { discord_id: targetUserId },
  });

  if (!user) {
    return false; // User not found
  }

  const watchRequests = user.watch_requests;

  // Find the index of the watch request to delete
  const indexToDelete = watchRequests.findIndex(
    (watchRequestObject) => watchRequestObject.caller_id === callerId,
  );
  if (indexToDelete === -1) {
    return false; // WatchRequest with callerId not found
  }
  // Delete the watch request from the array
  watchRequests.splice(indexToDelete, 1);

  await dbDeleteWatchRequest(targetUserId, callerId);
  return true; // Successfully deleted the watchRequest
}

export async function executeWatch(
  target: User,
  notificationMethod: string,
  callerId: string,
  alertChannel: null | TextChannel = null,
): Promise<boolean> {
  const user = await db.users.findUnique({
    include: { watch_requests: true },
    where: { discord_id: target.id },
  });

  if (user) {
    const watchRequests = user.watch_requests;

    // Check for duplicate request using array iteration
    const duplicateRequest = watchRequests.some(
      (watchRequestObject) => watchRequestObject.caller_id === callerId,
    );

    if (duplicateRequest) {
      log.info(F, `Duplicate watch request found for callerId: ${callerId}`);
      return false;
    }

    // Add the new watch request
    watchRequests.push({
      caller_id: callerId,
      channel_id: alertChannel ? alertChannel.id : null,
      id: '',
      notification_method: notificationMethod,
      usersId: null,
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

export async function nightsWatch(message: Message) {
  const user = await db.users.findUnique({
    include: { watch_requests: true },
    where: { discord_id: message.author.id },
  });

  if (!user || !message.guild || user.discord_id === null) {
    return;
  }

  const watchRequests = user.watch_requests;

  if (watchRequests.length === 0) {
    return;
  }

  for (const watchRequestObject of watchRequests) {
    const target = await message.client.users.fetch(user.discord_id);

    if (watchRequestObject.notification_method === 'dm') {
      const caller = await message.client.users.fetch(watchRequestObject.caller_id);
      if (caller) {
        try {
          await caller.send(
            `Hey ${caller}, the user ${target} which you were watching has been active recently in ${message.channel}.`,
          );
        } catch {
          log.info(F, "Failed to fulfill Watch Request. Likely can't DM user.");
        }

        await deleteWatchRequest(user.discord_id, caller.id);
      }
    } else if (watchRequestObject.notification_method === 'channel') {
      const tripsitGuild = await message.client.guilds.fetch(env.DISCORD_GUILD_ID);
      if (watchRequestObject.channel_id) {
        const notificationChannel = (await tripsitGuild.channels.fetch(
          watchRequestObject.channel_id,
        )) as TextChannel;
        const caller = await message.client.users.fetch(watchRequestObject.caller_id);
        try {
          await notificationChannel.send(
            `Hey ${caller}, the user ${target} which you were watching has been active recently in ${message.channel}.`,
          );
        } catch {
          log.info(F, 'Failed to fulfill Watch Request. Notification sending failed.');
        }
        await deleteWatchRequest(user.discord_id, caller.id);
      }
    }
  }
}
