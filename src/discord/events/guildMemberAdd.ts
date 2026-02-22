import {
  GuildMemberAddEvent,
} from '../@types/eventDef';

import trust from '../utils/trust';
import { giveMilestone } from '../../global/utils/experience';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const F = f(__filename);

export const guildMemberAdd: GuildMemberAddEvent = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      await member.fetch(true);
    } catch (fetchError) {
      // If we can't fetch the member, then they joined and left immediately
      if (fetchError instanceof Error && 'code' in fetchError && fetchError.code === 10007) {
        log.debug(F, `Member ${member.id} left before we could process them`);
        return;
      }
      // Re-throw other errors so we can handle them later too, or fix if needed.
      throw fetchError;
    }

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
      // Run the milestone check to make sure the user gets a level role
      await giveMilestone(member);
    } catch (err) {
      log.error(F, `Error: ${err}`);
      log.debug(F, `member: ${JSON.stringify(member)}`);
      log.debug(F, `member.guild: ${JSON.stringify(member.guild)}`);
    }
  },
};

export default guildMemberAdd;
