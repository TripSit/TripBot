'use strict';

const PREFIX = require('path').parse(__filename).name;
const { info } = require('console');
const logger = require('../../global/utils/logger');

module.exports = {
  name: 'voiceStateUpdate',

  async execute(Old, New) {
    if (New.member.bot) return;
    if (Old.member.bot) return;

    logger.debug(`[${PREFIX}] VoiceState updated, member wasn't a bot`);

    if (New.channelId === process.env.TempVoiceChanId) {
      logger.debug(`[${PREFIX}] member joined the magic chan`);

      New.member.guild.channels.create(`${New.member.user.username}'s lounge`, {
        type: 2,
        parent: process.env.TempVoiceCatId,
      });
    }

    if (Old.channel.parent?.id !== process.env.TempVoiceCatId) return;

    Old.client.channels.cache.get(process.env.TempVoiceCatId).children.forEach(channel => {
      if (channel.type === 'GUILD_VOICE') {
        if (channel.id !== process.env.TempVoiceChanId) {
          if (channel.members.size < 1) {
            channel.delete('beep boop, i love to clean up');
          }
        }
      }
    });
  },
};
