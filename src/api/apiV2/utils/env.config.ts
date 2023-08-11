/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-explicit-any */
require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  NODE_ENV: isProd ? 'production' : 'development',
  // DEBUG_LEVEL: isProd ? 'info' : 'debug',
  DEBUG_LEVEL: 'debug',
  API_USERNAME: process.env.API_USERNAME,
  API_PASSWORD: process.env.API_PASSWORD,
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
  DISCORD_CLIENT_TOKEN: process.env.DISCORD_CLIENT_TOKEN,
};

export default env;

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var env: any; // NOSONAR
}

global.env = env;
