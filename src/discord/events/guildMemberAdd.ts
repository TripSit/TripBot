import type { GuildMemberAddEvent } from '../@types/eventDef';

import trust from '../utils/trust';

const F = f(__filename);

export const guildMemberAdd: GuildMemberAddEvent = {
  async execute(member) {
    await member.fetch(true);

    try {
      const guildData = await db.discord_guilds.upsert({
        create: {
          id: member.guild.id,
        },
        update: {},
        where: {
          id: member.guild.id,
        },
      });

      // log.debug(F, `guildData: ${JSON.stringify(guildData)}`);

      if (!guildData) {
        return;
      }

      if (!guildData.cooperative) {
        return;
      }

      await trust(member);
    } catch (error) {
      log.error(F, `Error: ${error}`);
      log.debug(F, `member: ${JSON.stringify(member)}`);
      log.debug(F, `member.guild: ${JSON.stringify(member.guild)}`);
    }
  },
  name: 'guildMemberAdd',
};

export default guildMemberAdd;
