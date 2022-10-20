import {
  Guild,
  Role,
} from 'discord.js';
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

type timerEntry = {
  [key: string]: {
    type: 'reminder' | 'mindset' | 'helpthread'
    value: string
  }
}

const intervalSeconds = env.NODE_ENV === 'production' ? 60 : 5;

/**
 * This function starts the timer
 */
export async function runTimer() {
  // logger.info(`[${PREFIX}] started!`);
  const timerDb = {} as any;
  if (global.db) {
    const timerRef = global.db.ref(`${env.FIREBASE_DB_TIMERS}`);
    timerRef.on('child_changed', (snapshot) => {
      if (snapshot.key !== null) {
      // logger.debug(`[${PREFIX}] changed key: ${JSON.stringify(snapshot.key, null, 4)}`);
      // logger.debug(`[${PREFIX}] changed val: ${JSON.stringify(snapshot.val(), null, 4)}`);
        timerDb[snapshot.key] = snapshot.val();
      }
    });

    timerRef.on('child_added', (snapshot) => {
      if (snapshot.key !== null) {
      // logger.debug(`[${PREFIX}] added key: ${JSON.stringify(snapshot.key, null, 4)}`);
      // logger.debug(`[${PREFIX}] added val: ${JSON.stringify(snapshot.val(), null, 4)}`);
        timerDb[snapshot.key] = snapshot.val();
      // logger.debug(`[${PREFIX}] global.userDb: ${JSON.stringify(global.userDb, null, 4)}`);
      }
    });

    timerRef.on('child_removed', (snapshot) => {
      if (snapshot.key !== null) {
      // logger.debug(`[${PREFIX}] removed key: ${JSON.stringify(snapshot.key, null, 4)}`);
      // logger.debug(`[${PREFIX}] removed val: ${JSON.stringify(snapshot.val(), null, 4)}`);
      // logger.debug(`[${PREFIX}] timerDb[snapshot.key]: ${JSON.stringify(timerDb[snapshot.key], null, 4)}`);
      // logger.debug(`[${PREFIX}] snapshot.val().key: ${JSON.stringify(Object.keys(snapshot.val())[0], null, 4)}`);
        delete timerDb[snapshot.key][Object.keys(snapshot.val())[0]];
      }
    });
  }

  // let i = 0;
  /**
   * This timer runs every minute to determine if there are any tasks to perform
   * This function uses setTimeout so that it can finish runing before the next loop
   * @param {number} interval How often to run the loop
   */
  function checkTimers(interval:number) {
    // i += 1;
    setTimeout(
      async () => {
        // logger.debug(`[${PREFIX}] iteration ${i} at ${new Date()}`);
        Object.keys(timerDb).forEach(async (userId) => {
          const userInfo = timerDb[userId as keyof typeof timerDb] as timerEntry;
          // logger.debug(`[${PREFIX}] ${JSON.stringify(userInfo, null, 4)}`);
          Object.keys(userInfo).forEach(async (timevalue) => {
            const timerEntry = userInfo[timevalue];
            const reminderTime = new Date(parseInt(timevalue, 10));
            // logger.debug(`[${PREFIX}] ${userId} has a ${timerEntry.type} at ${reminderTime} - ${timerEntry.value}`);
            const now = new Date();
            if (now > reminderTime) {
              if (timerEntry.type === 'reminder') {
                const user = await global.client.users.fetch(userId);
                if (user) {
                  user.send(`Hey ${user.username}, you asked me to remind you: ${timerEntry.value}`);
                }
                const entryRef = `${env.FIREBASE_DB_TIMERS}/${userId}/${timevalue}`;
                logger.debug(`[${PREFIX}] deleting ${entryRef}`);
                await global.db.ref(entryRef).remove();
              }
              // if (timerEntry.type === 'mindset') {
              //   const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID) as Guild;
              //   const role = tripsitGuild.roles.cache.find((role:Role) => role.id === timerEntry.value) as Role;
              //   try {
              //     const member = await tripsitGuild.members.fetch(userId);
              //     if (member && role) {
              //       member.roles.remove(role);
              //     }
              //   } catch (err) {
              //     logger.error(`[${PREFIX}] Member left the server`);
              //   }
              //   const entryRef = `${env.FIREBASE_DB_TIMERS}/${userId}/${timevalue}`;
              //   logger.debug(`[${PREFIX}] deleting ${entryRef}`);
              //   await global.db.ref(entryRef).remove();
              //   logger.debug(`[${PREFIX}] I would remove a mindset!`);
              // }
              if (timerEntry.type === 'helpthread') {
                const helpThread = (timerEntry.value as any).lastHelpedThreadId;
                // logger.debug(`[${PREFIX}] helpThread: ${JSON.stringify(helpThread, null, 4)}`);
                const oldRoles = (timerEntry.value as any).roles;
                // logger.debug(`[${PREFIX}] oldRoles: ${JSON.stringify(oldRoles, null, 4)}`);
                const status = (timerEntry.value as any).status;
                // logger.debug(`[${PREFIX}] status: ${JSON.stringify(status, null, 4)}`);
                if (status === 'open') {
                  const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID) as Guild;
                  // logger.debug(`[${PREFIX}] tripsitGuild: ${JSON.stringify(tripsitGuild, null, 4)}`);
                  try {
                    const member = await tripsitGuild.members.fetch(userId);
                    // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 4)}`);
                    const needsHelpRole = tripsitGuild.roles.cache.find(
                      (role:Role) => role.id === env.ROLE_NEEDSHELP) as Role;
                      // logger.debug(`[${PREFIX}] needsHelpRole: ${JSON.stringify(needsHelpRole, null, 4)}`);
                    member.roles.remove(needsHelpRole);
                    oldRoles.forEach(async (roleId:string) => {
                      const role = tripsitGuild.roles.cache.find((role:Role) => role.id === roleId) as Role;
                      // logger.debug(`[${PREFIX}] role: ${JSON.stringify(role, null, 4)}`);
                      if (role && role.name !== '@everyone') {
                        try {
                          await member.roles.add(role);
                        } catch (err) {
                          logger.debug(`[${PREFIX}] I dont have permission to add ${role.name} to \
                          ${member.user.username}`);
                        }
                      }
                    });
                  } catch (err) {
                    logger.debug(`[${PREFIX}] Member left the server`);
                  }

                  // Lock the threads
                  // try {
                  //   const helpChannel = await tripsitGuild.channels.fetch(helpThread);
                  //   if (helpChannel && helpChannel.isThread()) {
                  //     (helpChannel as ThreadChannel).setLocked(true, 'Help thread closed');
                  //     logger.debug(`[${PREFIX}] Help thread locked`);
                  //   }
                  // } catch (err) {
                  //   logger.debug(`[${PREFIX}] Help thread not found`);
                  // }

                  // try {
                  //   const metaChannel = await tripsitGuild.channels.fetch(metaThread);
                  //   if (metaChannel && metaChannel.isThread()) {
                  //     (metaChannel as ThreadChannel).setLocked(true, 'Meta thread closed');
                  //     logger.debug(`[${PREFIX}] Meta thread locked`);
                  //   }
                  // } catch (err) {
                  //   logger.debug(`[${PREFIX}] Meta thread not found`);
                  // }

                  await global.db.ref(`${env.FIREBASE_DB_TIMERS}/${userId}/${timevalue}`).remove();

                  const threadDeleteTime = new Date();
                  // const oneDay = 1000 * 60 * 60 * 24;
                  const thirtySec = 1000 * 30;
                  const oneWeek = 1000 * 60 * 60 * 24 * 7;
                  const deleteTime = env.NODE_ENV === 'production' ?
                    threadDeleteTime.getTime() + oneWeek :
                    threadDeleteTime.getTime() + thirtySec;

                  threadDeleteTime.setTime(deleteTime);
                  logger.debug(`[${PREFIX}] threadDeleteTime: ${threadDeleteTime}`);

                  const newTimer = global.db.ref(`${env.FIREBASE_DB_TIMERS}/${userId}/`);
                  await newTimer.update({
                    [threadDeleteTime.valueOf()]: {
                      type: 'helpthread',
                      value: {
                        lastHelpedThreadId: helpThread,
                        status: 'archived',
                      },
                    },
                  });
                } if (status === 'archived') {
                  const helpThread = (timerEntry.value as any).lastHelpedThreadId;
                  logger.debug(`[${PREFIX}] helpThread: ${JSON.stringify(helpThread, null, 4)}`);

                  const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID);
                  try {
                    const helpChannel = await tripsitGuild.channels.fetch(helpThread);
                    if (helpChannel) {
                      helpChannel.delete();
                    }
                  } catch (err) {
                    logger.debug(`[${PREFIX}] Help thread already deleted`);
                  }
                  await global.db.ref(`${env.FIREBASE_DB_TIMERS}/${userId}/${timevalue}`).remove();
                }
              }
            }
          });
        });
        checkTimers(interval);
      },
      interval,
    );
  }
  logger.info(`[${PREFIX}] started!`);
  checkTimers(intervalSeconds * 1000);
};
