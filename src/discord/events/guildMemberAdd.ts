import {
  time,
  Client,
  GuildMember,
  Colors,
  TextChannel,
  UserResolvable,
  Collection,
} from 'discord.js';
import {
  guildMemberEvent,
} from '../@types/eventDef';
import logger from '../../global/utils/logger';
import env from '../../global/utils/env.config';
import {embedTemplate} from '../utils/embedTemplate';
import {stripIndents} from 'common-tags';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const guildMemberAdd: guildMemberEvent = {
  name: 'guildMemberAdd',
  async execute(member: GuildMember, client: Client) {
    logger.debug(`[${PREFIX}] starting!`);
    // logger.debug(JSON.stringify(member, null, 2));
    // {
    //   "guildId": "960606557622657026",
    //   "joinedTimestamp": 1653515791290,
    //   "premiumSinceTimestamp": null,
    //   "nickname": null,
    //   "pending": false,
    //   "communicationDisabledUntilTimestamp": null,
    //   "userId": "332687787172167680",
    //   "avatar": null,
    //   "displayName": "cosmicowl",
    //   "roles": [
    //     "960606557622657026"
    //   ],
    //   "avatarURL": null,
    //   "displayAvatarURL": "https://cdn.discordapp.com/avatars/test/test.webp"
    // }

    // Only run on Tripsit
    logger.debug(`[${PREFIX}] guild: ${member.guild.id}`);
    if (member.guild.id === env.DISCORD_GUILD_ID.toString()) {
      logger.info(`[${PREFIX}] ${member} joined guild: ${member.guild.name} (id: ${member.guild.id})`);

      // const roleUnverfied = member.guild.roles.cache.find(role => role.id === roleUnverifiedId);
      // member.roles.add(roleUnverfied);

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
      logger.debug(`[${PREFIX}] inviteInfo: ${inviteInfo}`);
      global.guildInvites.set(
        member.guild.id,
        new Collection(newInvites.map((invite) => [invite.code, invite.uses])),
      );

      if (global.db) {
        const ref = db.ref(`${env.FIREBASE_DB_USERS}/${member.user.id}/discord`);
        ref.update({
          tag: member.user.tag,
          joinedTimestamp: member.joinedTimestamp,
          nickname: member.nickname,
          inviteInfo,
        });
      }

      logger.debug(`[${PREFIX}] Date.now(): ${Date.now()}`);
      logger.debug(`[${PREFIX}] member.user.createdAt: ${member.user.createdAt.toString()}`);

      const diff = Math.abs(Date.now() - Date.parse(member.user.createdAt.toString()));
      logger.debug(`[${PREFIX}] diff: ${diff}`);
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

      if (global.db) {
        const ref = db.ref(`${env.FIREBASE_DB_TIMERS}/${member!.user.id}`);
        await ref.once('value', (data) => {
          if (data.val() !== null) {
            Object.keys(data.val()).forEach(async (key) => {
              const timer = data.val()[key];
              if (timer.type === 'helpthread') {
                const helpChannel = await member.client.channels.fetch(
                  timer.value.lastHelpedThreadId) as TextChannel;
                helpChannel.send(`${member.user} has rejoined the guild!`);
              }
            });
          }
        });
      }
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
