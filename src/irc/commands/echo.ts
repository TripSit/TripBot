import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

/**
 *
 * @param {string} message
 * @return {Promise<void>}
 */
export async function echo(message:any): Promise<void> {
  logger.debug(`[${PREFIX}] start!`);
  // Split out the command and the rest of the message
  const text = message.args[1].split(' ');
  // Remove the first element in the array because it's the command name
  text.shift();
  // Rejoin the rest of the message
  const result = text.join(' ');
  // Send the message back to the channel
  global.ircClient.say(message.args[0], result);
};
