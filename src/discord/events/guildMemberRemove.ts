import {
  Colors,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import {
  GuildMemberRemoveEvent,
} from '../@types/eventDef';
import { embedTemplate } from '../utils/embedTemplate';

const F = f(__filename);

export const guildMemberRemove: GuildMemberRemoveEvent = {
  name: 'guildMemberRemove',
  async execute(member) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (member.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `${member} left guild: ${member.guild.name} (id: ${member.guild.id})`);

    const { joinedTimestamp } = member;

    // log.debug(F, `joinedTimestamp: ${joinedTimestamp}`);
    const embed = embedTemplate()
      .setColor(Colors.Red);

    if (joinedTimestamp) {
      const diff = Math.abs(Date.now() - joinedTimestamp);
      // Helper to calculate units and update remaining time
      const getUnit = (time: number, unitMs: number) => {
        const value = Math.floor(time / unitMs);
        return [value, time % unitMs];
      };
      const remaining = diff;
      const [years, afterYears] = getUnit(remaining, 1000 * 60 * 60 * 24 * 365);
      const [months, afterMonths] = getUnit(afterYears, 1000 * 60 * 60 * 24 * 30);
      const [weeks, afterWeeks] = getUnit(afterMonths, 1000 * 60 * 60 * 24 * 7);
      const [days, afterDays] = getUnit(afterWeeks, 1000 * 60 * 60 * 24);
      const [hours, afterHours] = getUnit(afterDays, 1000 * 60 * 60);
      const [minutes, afterMinutes] = getUnit(afterHours, 1000 * 60);
      const [seconds] = getUnit(afterMinutes, 1000);
      // Build duration string dynamically
      const duration = [
        years && `${years} year${years > 1 ? 's' : ''}`,
        months && `${months} month${months > 1 ? 's' : ''}`,
        weeks && `${weeks} week${weeks > 1 ? 's' : ''}`,
        days && `${days} day${days > 1 ? 's' : ''}`,
        hours && `${hours} hour${hours > 1 ? 's' : ''}`,
        minutes && `${minutes} minute${minutes > 1 ? 's' : ''}`,
        seconds && `${seconds} second${seconds > 1 ? 's' : ''}`,
      ]
        .filter(Boolean)
        .join(', ');

      // eslint-disable-next-line max-len
      embed.setDescription(`${member} (${member.displayName || member.user?.tag}) has left the guild after ${duration}`);
    } else {
      embed.setDescription(`${member} (${member.displayName || member.user?.tag}) has left the guild`);
    }

    const targetData = await db.users.upsert({
      where: {
        discord_id: member.id,
      },
      create: {
        discord_id: member.id,
        removed_at: new Date(),
      },
      update: {
        removed_at: new Date(),
      },
    });

    const guildData = await db.discord_guilds.upsert({
      where: {
        id: member.guild.id,
      },
      create: {
        id: member.guild.id,
      },
      update: {},
    });

    let modThread = null as ThreadChannel | null;
    if (targetData.mod_thread_id) {
      // log.debug(F, `Mod thread id exists: ${targetData.mod_thread_id}`);
      try {
        modThread = await member.guild.channels.fetch(targetData.mod_thread_id) as ThreadChannel | null;
        // log.debug(F, 'Mod thread exists');
      } catch (err) {
        // log.debug(F, 'Mod thread does not exist');
      }

      if (modThread) {
        await modThread.send({ embeds: [embed] });
        await modThread.setName(`🚶│${member.displayName}`);
      }
    }

    if (guildData.channel_mod_log) {
      const auditLog = await discordClient.channels.fetch(guildData.channel_mod_log) as TextChannel;
      await auditLog.send({ embeds: [embed] });
    }
  },
};

export default guildMemberRemove;
