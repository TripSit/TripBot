import {
  time,
  Colors,
  TextChannel,
  UserResolvable,
  Collection,
} from 'discord.js';
import {
  guildMemberAddEvent,
} from '../@types/eventDef';
import {db} from '../../global/utils/knex';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';
import {embedTemplate} from '../utils/embedTemplate';
import {stripIndents} from 'common-tags';

import {parse} from 'path';
import {Users} from '../../global/@types/pgdb';
const PREFIX = parse(__filename).name;

export const guildMemberAdd: guildMemberAddEvent = {
  name: 'guildMemberAdd',
  async execute(member) {
    // Only run on Tripsit
    if (member.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }
    log.info(`[${PREFIX}] ${member} joined guild: ${member.guild.name} (id: ${member.guild.id})`);

    const newInvites = await member.guild.invites.fetch();
    const cachedInvites = global.guildInvites.get(member.guild.id);
    const invite = newInvites.find((i) => <number>i.uses > cachedInvites.get(i.code));
    let inviteInfo = '';
    if (invite) {
      const inviter = await client.users.fetch(invite.inviter?.id as UserResolvable);
      inviteInfo = inviter ?
        `Joined via ${inviter.tag}'s invite to ${invite.channel?.name} (${invite.code}-${invite.uses})` :
        `Joined via the vanity url`;
    }
    // log.debug(`[${PREFIX}] inviteInfo: ${inviteInfo}`);
    global.guildInvites.set(
      member.guild.id,
      new Collection(newInvites.map((invite) => [invite.code, invite.uses])),
    );

    await db<Users>('users')
      .insert({
        discord_id: member.id,
        joined_at: member.joinedAt ?? new Date(),
      })
      .onConflict('discord_id')
      .merge();

    // log.debug(`[${PREFIX}] Date.now(): ${Date.now()}`);
    // log.debug(`[${PREFIX}] member.user.createdAt: ${member.user.createdAt.toString()}`);

    const diff = Math.abs(Date.now() - Date.parse(member.user.createdAt.toString()));
    // log.debug(`[${PREFIX}] diff: ${diff}`);
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
    const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    let colorValue = 0;
    if (years > 0) {
      colorValue = Colors.White;
    } else if (years === 0 && months > 0) {
      colorValue = Colors.Purple;
    } else if (months === 0 && weeks > 0) {
      colorValue = Colors.Blue;
    } else if (weeks === 0 && days > 0) {
      colorValue = Colors.Green;
    } else if (days === 0 && hours > 0) {
      colorValue = Colors.Yellow;
    } else if (hours === 0 && minutes > 0) {
      colorValue = Colors.Orange;
    } else if (minutes === 0 && seconds > 0) {
      colorValue = Colors.Red;
    }

    const embed = embedTemplate()
      .setAuthor(null)
      .setColor(colorValue)
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter(null)
      .setDescription(stripIndents`**${member} has joined the guild!**`)
      .addFields(
        {name: 'Nickname', value: `${member.nickname}`, inline: true},
        {name: 'Tag', value: `${member.user.username}#${member.user.discriminator}`, inline: true},
        {name: 'ID', value: `${member.user.id}`, inline: true},
      )
      .addFields(
        {name: 'Account created', value: `${time(member.user.createdAt, 'R')}`, inline: true},
      );
    if (member.joinedAt) {
      embed.addFields(
        {name: 'Joined', value: `${time(member.joinedAt, 'R')}`, inline: true},
      );
    }
    if (inviteInfo) {
      embed.setFooter({text: inviteInfo});
    }
    const channelBotlog = member.guild.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    if (channelBotlog) {
      channelBotlog.send({embeds: [embed]});
    }
  },
};
