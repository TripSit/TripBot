import {
  GuildMemberAddEvent,
} from '../@types/eventDef';

import trust from '../utils/trust';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const F = f(__filename);

export const guildMemberAdd: GuildMemberAddEvent = {
  name: 'guildMemberAdd',
  async execute(member) {
    await member.fetch(true);
    const guildData = await db.discord_guilds.upsert({
      where: {
        id: member.guild.id,
        cooperative: true,
      },
      create: {
        id: member.guild.id,
      },
      update: {},
    });

    // log.debug(F, `guildData: ${JSON.stringify(guildData)}`);

    if (!guildData) return;

    if (member.guild.id !== env.DISCORD_GUILD_ID) return;
    await trust(member);
  },
};

export default guildMemberAdd;
