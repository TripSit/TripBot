import {
  Colors,
  TextChannel,
} from 'discord.js';
import { parse } from 'path';
import {
  GuildMemberRemoveEvent,
} from '../@types/eventDef';
import { db } from '../../global/utils/knex';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';
import { embedTemplate } from '../utils/embedTemplate';
import { Users } from '../../global/@types/pgdb';

const PREFIX = parse(__filename).name;

export default guildMemberRemove;

export const guildMemberRemove: GuildMemberRemoveEvent = {
  name: 'guildMemberRemove',
  async execute(member) {
    // Only run on the tripsit guild
    if (member.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }

    log.info(`[${PREFIX}] ${member} left guild: ${member.guild.name} (id: ${member.guild.id})`);

    const { joinedTimestamp } = member;

    // log.debug(`[${PREFIX}] joinedTimestamp: ${joinedTimestamp}`);
    const embed = embedTemplate()
      .setColor(Colors.Red);

    if (joinedTimestamp) {
      // log.debug(`[${PREFIX}] Date.now(): ${Date.now()}`);
      // display the difference between the two dates
      // NOTE: Can simplify with luxon
      const diff = Math.abs(Date.now() - joinedTimestamp);
      // log.debug(`[${PREFIX}] diff: ${diff}`);
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
      const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
      const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      embed.setDescription(`${member} has left the guild after\
                  ${years > 0 ? `${years} years` : ''}\
                  ${years === 0 && months > 0 ? `${months} months` : ''}\
                  ${months === 0 && weeks > 0 ? `${weeks} weeks` : ''}\
                  ${weeks === 0 && days > 0 ? `${days} days` : ''}\
                  ${days === 0 && hours > 0 ? `${hours} hours` : ''}\
                  ${hours === 0 && minutes > 0 ? `${minutes} minutes` : ''}\
                  ${minutes === 0 && seconds > 0 ? `${seconds} seconds` : ''}`);
    } else {
      embed.setDescription(`${member} has left the guild`);
    }

    const channelBotlog = member.guild.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    if (channelBotlog) {
      channelBotlog.send({ embeds: [embed] });
    }

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
