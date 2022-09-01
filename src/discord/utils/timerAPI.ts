import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';

const PREFIX = require('path').parse(__filename).name;


// type timerEntry = {
//   type: 'reminder' | 'mindset' | 'helpthread'
//   value: string
// }

const intervalSeconds = env.NODE_ENV === 'production' ? 60 : 5;

/**
 * This function starts the timer
 */
export async function runTimer() {
  logger.info(`[${PREFIX}] started!`);
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
          checkTimers(interval);
        },
        interval,
    );
  }
  checkTimers(intervalSeconds * 1000);
};
