export default validateEnv;

export const validateEnv = () => {
  const F = f(__filename);
  if (!process.env.DISCORD_CLIENT_TOKEN) {
    log.error(F, 'Missing DISCORD_CLIENT_TOKEN: You wont be able to login to discord.');
    return false;
  }

  if (!process.env.DISCORD_CLIENT_ID) {
    log.error(F, 'Missing DISCORD_CLIENT_ID: You wont be able to login to discord.');
    return false;
  }

  if (!process.env.DISCORD_CLIENT_SECRET) {
    log.error(F, 'Missing DISCORD_CLIENT_SECRET: You wont be able to login to discord.');
    return false;
  }

  if (!process.env.GITHUB_TOKEN) {
    log.warn(F, 'Missing GITHUB_TOKEN: You wont be able to use /issue');
  }

  if (!process.env.RAPID_TOKEN) {
    log.warn(F, 'Missing RAPID_TOKEN: You wont be able to use /joke');
  }

  // if (!process.env.DISCORD_CLIENT_REDIRECT_URI) {
  //   log.warn(F, `Missing DISCORD_CLIENT_REDIRECT_URI: You wont be able to login to discord.`);
  // }

  // if (!process.env.IRC_PASSWORD) {
  //   log.warn(F, `Missing IRC_PASSWORD: You wont be able to login to IRC.`);
  // }

  return true;
};
