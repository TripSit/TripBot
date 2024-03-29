import {
  GuildMemberAddEvent,
} from '../@types/eventDef';
import { tripsitMemberAdd } from '../commands/guild/d.tripsit';

import trust from '../utils/trust';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const F = f(__filename);

export const guildMemberAdd: GuildMemberAddEvent = {
  name: 'guildMemberAdd',
  async execute(member) {
    await member.fetch(true);
    const guildData = await db.discord_guilds.upsert({
      where: { id: member.guild.id },
      create: { id: member.guild.id },
      update: {},
    });

    if (guildData?.cooperative) {
      await trust(member);
    }

    const sessionData = await db.session_data.findFirst({ where: { guild_id: member.guild.id } });
    if (sessionData) {
      await tripsitMemberAdd(member);
    }
  },
};

export default guildMemberAdd;
