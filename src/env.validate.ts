export const validateEnv = () => {
  if (!process.env.GITHUB_AUTH_TOKEN) {
    console.warn(`Missing GITHUB_AUTH_TOKEN:
    You wont be able to use /issue`);
  }

  if (!process.env.DISCORD_CLIENT_ID) {
    console.warn(`Missing DISCORD_CLIENT_ID:
    You wont be able to login to discord.`);
  }

  if (!process.env.DISCORD_CLIENT_SECRET) {
    console.warn(`Missing DISCORD_CLIENT_SECRET:
    You wont be able to login to discord.`);
  }
  if (!process.env.DISCORD_CLIENT_REDIRECT_URI) {
    console.warn(`Missing DISCORD_CLIENT_REDIRECT_URI:
    You wont be able to login to discord.`);
  }

  if (!process.env.DISCORD_CLIENT_TOKEN) {
    console.warn(`Missing DISCORD_CLIENT_TOKEN:
    You wont be able to login to discord.`);
  }

  if (!process.env.DISCORD_OWNER_ID) {
    console.warn(`Missing DISCORD_CLIENT_TOKEN:
    This will limit your ability to interact with the discord bot.`);
  }

  if (!process.env.DISCORD_GUILD_ID) {
    console.warn(`Missing DISCORD_CLIENT_TOKEN:
    This will limit your bots ability to do a lot.`);
  }

  return true;
};
