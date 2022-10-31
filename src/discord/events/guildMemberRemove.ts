import {
  Colors,
  TextChannel,
} from 'discord.js';
import {
  guildMemberEvent,
} from '../@types/eventDef';
import {db} from '../../global/utils/knex';
import logger from '../../global/utils/logger';
import env from '../../global/utils/env.config';
import {embedTemplate} from '../utils/embedTemplate';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const guildMemberRemove: guildMemberEvent = {
  name: 'guildMemberRemove',
  async execute(member) {
    // Only run on the tripsit guild
    if (member.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    };
    logger.debug(`[${PREFIX}] starting!`);

    // logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}`);

    const joinedTimestamp = member.joinedTimestamp;

    logger.debug(`[${PREFIX}] joinedTimestamp: ${joinedTimestamp}`);
    const embed = embedTemplate()
      .setColor(Colors.Red);

    if (joinedTimestamp) {
      logger.debug(`[${PREFIX}] Date.now(): ${Date.now()}`);
      // display the difference between the two dates
      // NOTE: Can simplify with luxon
      const diff = Math.abs(Date.now() - joinedTimestamp);
      logger.debug(`[${PREFIX}] diff: ${diff}`);
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
      channelBotlog.send({embeds: [embed]});
    }

    await db
      .insert({
        discord_id: member.id,
        removed_at: new Date(),
      })
      .into('users')
      .onConflict('discord_id')
      .merge();

    // if (global.db) {
    //   const ref = db.ref(`${env.FIREBASE_DB_TIMERS}/${member!.user.id}`);
    //   await ref.once('value', (data) => {
    //     if (data.val() !== null) {
    //       Object.keys(data.val()).forEach(async (key) => {
    //         const timer = data.val()[key];
    //         if (timer.type === 'helpthread') {
    //           const helpChannel = await member.client.channels.fetch(
    //             timer.value.lastHelpedThreadId) as TextChannel;
    //           helpChannel.send(`${member.user} has left the guild!`);
    //         }
    //         if (timer.type === 'reminder') {
    //           logger.debug(`[${PREFIX}] delete reminder ${key}`);
    //         }
    //       });
    //     }
    //   });
    // }

    logger.debug(`[${PREFIX}] finished!`);
  },
};
