import fetch from 'cross-fetch';

const F = f(__filename);

export default {
  async getBans(discordId:string) {
    log.debug(F, `discordId: ${discordId}`);

    // Check if the given discordId is a series of numbers
    if (!/^\d+$/.test(discordId)) {
      throw new Error('Invalid discordId');
    }

    const guildApiResponse = await fetch(`https://discord.com/api/guilds/${env.DISCORD_GUILD_ID}/bans/${discordId}`, {
      headers: {
        Authorization: `Bot ${env.DISCORD_CLIENT_TOKEN}`,
      },
    });

    const guildData = await guildApiResponse.json();

    log.debug(F, `guildData: ${JSON.stringify(guildData, null, 2)}`);

    return guildData;
  },
};
