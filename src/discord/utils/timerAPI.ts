import {
  Guild,
} from 'discord.js';
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';

const PREFIX = require('path').parse(__filename).name;

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
  logger.info(`[${PREFIX}] started!`);
  const timerRef = global.db.ref(`${env.FIREBASE_DB_TIMERS}`);
  const timerDb = {} as any;

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

  let i = 0;
  /**
   * This timer runs every minute to determine if there are any tasks to perform
   * This function uses setTimeout so that it can finish runing before the next loop
   * @param {number} interval How often to run the loop
   */
  function checkTimers(interval:number) {
    i += 1;
    setTimeout(
        async () => {
          logger.debug(`[${PREFIX}] iteration ${i} at ${new Date()}`);
          Object.keys(timerDb).forEach(async (userId) => {
            const userInfo = timerDb[userId as keyof typeof timerDb] as timerEntry;
            // logger.debug(`[${PREFIX}] ${JSON.stringify(userInfo, null, 4)}`);
            Object.keys(userInfo).forEach(async (timevalue) => {
              const timerEntry = userInfo[timevalue];
              const reminderTime = new Date(parseInt(timevalue, 10));
              logger.debug(`[${PREFIX}] ${userId} has a ${timerEntry.type} at ${reminderTime} - ${timerEntry.value}`);
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
                if (timerEntry.type === 'mindset') {
                  const tripsitGuild = await global.client.guilds.fetch(env.DISCORD_GUILD_ID) as Guild;
                  logger.debug(`[${PREFIX}] tripsitGuild: ${tripsitGuild}`);
                  logger.debug(`[${PREFIX}] I would remove a mindset!`);
                }
                if (timerEntry.type === 'helpthread') {
                  logger.debug(`[${PREFIX}] I would delete a thread!`);
                }
              }
            });
          });
          checkTimers(interval);
        },
        interval,
    );
  }
  checkTimers(intervalSeconds * 1000);
};
