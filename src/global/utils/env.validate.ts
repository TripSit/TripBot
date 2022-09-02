export const validateEnv = () => {
  if (!process.env.GITHUB_TOKEN) {
    console.warn(`Missing GITHUB_TOKEN:
    You wont be able to use /issue`);
  }

  if (!process.env.RAPID_TOKEN) {
    console.warn(`Missing RAPID_TOKEN:
    You wont be able to use /joke`);
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

  return true;
};
