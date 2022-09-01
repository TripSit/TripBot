import {
  GuildMember,
  Colors,
  TextChannel,
} from 'discord.js';
import logger from '../../global/utils/logger';
import env from '../../global/utils/env.config';
import {embedTemplate} from '../utils/embedTemplate';
const PREFIX = require('path').parse(__filename).name;

module.exports = {
  name: 'guildMemberRemove',
  async execute(member: GuildMember) {
    logger.debug(`[${PREFIX}] starting!`);
    if (member.guild.id === env.DISCORD_GUILD_ID.toString()) {
      logger.debug(`[${PREFIX}] guildMemberRemove`);
      logger.debug(`[${PREFIX}] member: ${JSON.stringify(member, null, 2)}`);

      logger.debug(`[${PREFIX}] Setting ${member.user.id}`);
      const ref = db.ref(`${env.FIREBASE_DB_USERS}/${member.user.id}`);
      let joinedTimestamp = member.joinedTimestamp;
      await ref.once('value', (data:any) => {
        if (data.val() !== null) {
          if (data.val().discord) {
            joinedTimestamp = data.val().discord.joinedTimestamp;
          }
        }
      });

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
      try {
        const channelModlog = await member.client.channels.cache.get(env.CHANNEL_MODLOG.toString()) as TextChannel;
        if (channelModlog) {
          channelModlog.send({embeds: [embed]});
        }
      } catch (err) {
        logger.debug(`[${PREFIX}] Failed to send message, am i still in the tripsit guild?`);
      }
    }
    logger.debug(`[${PREFIX}] finished!`);
  },
};
