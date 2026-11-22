import {
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import {
  GuildMemberRemoveEvent,
} from '../@types/eventDef';
import { errorEmbed } from '../utils/embedTemplate';
import orDefault from '../../global/utils/orDefault';
import { getOrCreateGuild } from '../../global/utils/dbRecords';

const F = f(__filename);

const DURATION_UNITS: [string, number][] = [
  ['year', 1000 * 60 * 60 * 24 * 365],
  ['month', 1000 * 60 * 60 * 24 * 30],
  ['week', 1000 * 60 * 60 * 24 * 7],
  ['day', 1000 * 60 * 60 * 24],
  ['hour', 1000 * 60 * 60],
  ['minute', 1000 * 60],
  ['second', 1000],
];

// Discord did not exist before 2015; anything earlier is the placeholder a privacy scrub leaves behind
const MIN_REAL_JOIN_TIMESTAMP = Date.UTC(2015, 0, 1);

/** Builds a "1 year, 2 days, 5 seconds" style description, skipping units that are zero. */
function describeDuration(durationMs: number): string {
  let remaining = durationMs;
  const parts: string[] = [];
  DURATION_UNITS.forEach(([name, unitMs]) => {
    const value = Math.floor(remaining / unitMs);
    remaining %= unitMs;
    if (value) parts.push(`${value} ${name}${value > 1 ? 's' : ''}`);
  });
  return parts.join(', ');
}

export const guildMemberRemove: GuildMemberRemoveEvent = {
  name: 'guildMemberRemove',
  async execute(member) {
    // Only run on Tripsit, we don't want to snoop on other guilds ( ͡~ ͜ʖ ͡°)
    if (member.guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `${member} left guild: ${member.guild.name} (id: ${member.guild.id})`);

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

    // A member that was not in the cache when they left has no joinedTimestamp, so fall back to the join date the
    // bot stored. A scrubbed record carries a 1970 placeholder, which is not a real join date.
    const storedJoin = targetData.joined_at?.getTime() > MIN_REAL_JOIN_TIMESTAMP ? targetData.joined_at.getTime() : null;
    const joinedTimestamp = member.joinedTimestamp ?? storedJoin;

    const embed = errorEmbed();

    if (joinedTimestamp) {
      const duration = describeDuration(Math.abs(Date.now() - joinedTimestamp));
      // eslint-disable-next-line max-len
      embed.setDescription(`${member} (${orDefault(member.displayName, member.user?.tag)}) has left the guild after ${duration}`);
    } else {
      embed.setDescription(`${member} (${orDefault(member.displayName, member.user?.tag)}) has left the guild`);
    }

    const guildData = await getOrCreateGuild(member.guild.id);

    let modThread = null as ThreadChannel | null;
    if (targetData.mod_thread_id) {
      try {
        modThread = await member.guild.channels.fetch(targetData.mod_thread_id) as ThreadChannel | null;
      } catch {
        // The mod thread may have been deleted; continue without it.
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
