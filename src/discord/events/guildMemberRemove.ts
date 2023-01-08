import {
  Colors,
  TextChannel,
} from 'discord.js';
import {
  GuildMemberRemoveEvent,
} from '../@types/eventDef';
import { db } from '../../global/utils/knex';
import { embedTemplate } from '../utils/embedTemplate';
import { Users } from '../../global/@types/pgdb';

const F = f(__filename);

export default guildMemberRemove;

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
      // log.debug(F, `Date.now(): ${Date.now()}`);
      // display the difference between the two dates
      // NOTE: Can simplify with luxon
      const diff = Math.abs(Date.now() - joinedTimestamp);
      // log.debug(F, `diff: ${diff}`);
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365)) > 0
        ? `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365))} years, `
        : '';
      const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30)) > 0
        ? `${Math.floor(diff / (1000 * 60 * 60 * 24 * 30))} months, `
        : '';
      const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) > 0
        ? `${Math.floor(diff / (1000 * 60 * 60 * 24 * 7))} weeks, `
        : '';
      const days = Math.floor(diff / (1000 * 60 * 60 * 24)) > 0
        ? `${Math.floor(diff / (1000 * 60 * 60 * 24))} days, `
        : '';
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) > 0
        ? `${Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))} hours, `
        : '';
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        ? `${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))} minutes, `
        : '';
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        ? `${Math.floor((diff % (1000 * 60)) / 1000)} seconds`
        : '';
      const duration = `${years}${months}${weeks}${days}${hours}${minutes}${seconds}`;

      embed.setDescription(`${member} has left the guild after ${duration}`);
    } else {
      embed.setDescription(`${member} has left the guild`);
    }

    const auditlog = client.channels.cache.get(env.CHANNEL_AUDITLOG) as TextChannel;
    await auditlog.send({ embeds: [embed] });

    await db<Users>('users')
      .insert({
        discord_id: member.id,
        removed_at: new Date(),
      })
      .into('users')
      .onConflict('discord_id')
      .merge();
  },
};
