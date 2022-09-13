import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 *
 * @return {Promise<void>}
 */
export async function execute():Promise<void> {
  global.ircClient.addListener('error', (message:any) => {
    logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
    // It always seems to show this error first before actually working
    // The second error happens doing whois on a user
    if (message.args) {
      if (message.args[1] !== 'You have not registered' &&
        message.args[1] !== 'No such nick/channel' &&
        message.args[1].indexOf('is using a secure connection') === -1) {
        if (message.args[1] === 'You\'re not a channel operator') {
          global.ircClient.say(message.args[1], `Error: I am not an operator in ${message.args[1]}`);
          logger.error(`[${PREFIX}] I am not an operator in ${message.args[1]}`);
        } else {
          // global.ircClient.say(message.args[1], `Error: ${JSON.stringify(
          // message.args, null, 2).replace(/\n|\r/g, '')}`);
          logger.error(`[${PREFIX}] ${JSON.stringify(message, null, 2).replace(/\n|\r/g, '')}`);
          logger.error(message);
        }
      }
    } else {
      logger.error(`[${PREFIX}] Error:`);
      logger.error(message);
    }
  });
};
