import { getVoiceConnection } from '@discordjs/voice';
// import { stripIndents } from 'common-tags';
import { env } from './global/utils/env.config';
import { log } from './global/utils/log';
import { discordConnect } from './discord/discord'; // eslint-disable-line
import validateEnv from './global/utils/env.validate'; // eslint-disable-line
import { commandContext } from './discord/utils/context'; // eslint-disable-line
// import startMatrix from './matrix/matrix';

global.bootTime = new Date();

const F = f(__filename);

async function start() {
  log.info(F, 'Initializing service!');
  validateEnv('SERVICES');
  if (env.DISCORD_CLIENT_TOKEN && validateEnv('DISCORD')) await discordConnect();
  // if (env.MATRIX_ACCESS_TOKEN && validateEnv('MATRIX') && env.NODE_ENV !== 'production') await startMatrix();
}

start();

// Stop the bot when the process is closed (via Ctrl-C).
const destroy = () => {
  log.info(F, 'Gracefully stopping the bot (CTRL + C pressed)');
  // try {
  //   if (global.manager) {
  //     global.manager.teardown();
  //   }
  // } catch (err) {
  //   log.error(F, `${err}`);
  // }
  const existingConnection = getVoiceConnection(env.DISCORD_GUILD_ID);
  if (existingConnection) {
    existingConnection.destroy();
  }
  process.exit(0);
};
process.on('SIGINT', destroy);
process.on('SIGTERM', destroy);

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  // var env:any; // NOSONAR
  // eslint-disable-next-line no-var, vars-on-top
  var commandContext:any; // NOSONAR
}

global.env = env;
global.commandContext = commandContext;
