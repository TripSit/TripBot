export default function validateEnv(
  service: 'DISCORD' | 'MATRIX' | 'IRC' | 'TELEGRAM' | 'SERVICES',
) {
  const F = f(__filename);
  // log.info(F, `You are in ${process.env.NODE_ENV?.toUpperCase()}`);

  if (service === 'DISCORD') {
    if (!process.env.DISCORD_CLIENT_ID) {
      log.error(F, 'Missing DISCORD_CLIENT_ID: You wont be able to login to discord. You get this from the discord developer portal.');
      return false;
    }

    if (!process.env.DISCORD_GUILD_ID) {
      log.error(F, 'Missing DISCORD_GUILD_ID: You get this from your discord guild.');
      return false;
    }

    if (!process.env.DISCORD_CLIENT_TOKEN) {
      log.error(F, 'Missing DISCORD_CLIENT_TOKEN: You wont be able to login to discord. You get this from the discord developer portal.');
      return false;
    }
  }

  if (service === 'MATRIX' && !process.env.MATRIX_ACCESS_TOKEN) {
    log.error(F, 'Missing MATRIX_ACCESS_TOKEN, you won\'t be able to log into matrix');
    return false;
  }

  if (service === 'SERVICES') {
    if (!process.env.POSTGRES_DB_URL) {
      log.warn(F, 'Missing POSTGRES_DB_URL: You wont be able to use the database!');
    }

    if (!process.env.KEYCLOAK_BASE_URL || !process.env.KEYCLOAK_REALM_NAME || !process.env.KEYCLOAK_CLIENT_ID || !process.env.KEYCLOAK_CLIENT_SECRET) {
      log.warn(F, 'Missing keycloak credentials: You won\'t be able to interact with KeyCloak.');
    }

    if (!process.env.GITHUB_TOKEN) {
      log.warn(F, 'Missing GITHUB_TOKEN: You wont be able to use /issue');
    }

    if (!process.env.RAPID_TOKEN) {
      log.warn(F, 'Missing RAPID_TOKEN: You wont be able to use /joke');
    }

    if (!process.env.IMGUR_ID || !process.env.IMGUR_SECRET) {
      log.warn(F, 'Missing IMGUR_ID or IMGUR_SECRET: You wont be able to use /imgur');
    }

    if (!process.env.YOUTUBE_TOKEN) {
      log.warn(F, 'Missing YOUTUBE_TOKEN: You wont be able to use /youtube');
    }

    if (!process.env.IMDB_TOKEN) {
      log.warn(F, 'Missing IMDB_TOKEN: You wont be able to use /imdb');
    }
  }

  return true;
}
