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

    try {
      const guildData = await db.discord_guilds.upsert({
        where: {
          id: member.guild.id,
        },
        create: {
          id: member.guild.id,
        },
        update: {},
      });

      // log.debug(F, `guildData: ${JSON.stringify(guildData)}`);

      if (!guildData) return;

      if (!guildData.cooperative) return;

      await trust(member);
    } catch (err) {
      log.error(F, `Error: ${err}`);
      log.debug(F, `member: ${JSON.stringify(member)}`);
      log.debug(F, `member.guild: ${JSON.stringify(member.guild)}`);
    }
  },
};

export default guildMemberAdd;
