import log from '../../global/utils/log';

export const validateEnv = () => {
  if (!process.env.DISCORD_CLIENT_TOKEN) {
    log.error(`Missing DISCORD_CLIENT_TOKEN: You wont be able to login to discord.`);
    return false;
  }

  if (!process.env.DISCORD_CLIENT_ID) {
    log.error(`Missing DISCORD_CLIENT_ID: You wont be able to login to discord.`);
    return false;
  }

  if (!process.env.DISCORD_CLIENT_SECRET) {
    log.error(`Missing DISCORD_CLIENT_SECRET: You wont be able to login to discord.`);
    return false;
  }

  if (!process.env.GITHUB_TOKEN) {
    log.warn(`Missing GITHUB_TOKEN: You wont be able to use /issue`);
  }

  if (!process.env.RAPID_TOKEN) {
    log.warn(`Missing RAPID_TOKEN: You wont be able to use /joke`);
  }

  // if (!process.env.DISCORD_CLIENT_REDIRECT_URI) {
  //   log.warn(`Missing DISCORD_CLIENT_REDIRECT_URI: You wont be able to login to discord.`);
  // }

  // if (!process.env.IRC_PASSWORD) {
  //   log.warn(`Missing IRC_PASSWORD: You wont be able to login to IRC.`);
  // }

  return true;
};
