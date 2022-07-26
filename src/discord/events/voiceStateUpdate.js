'use strict';

const PREFIX = require('path').parse(__filename).name;
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

    if (Old.channel.type === 'GUILD_VOICE') {
      const filter = ch => (ch.parentID === process.env.TempVoiceCatId)
            && (ch.id !== process.env.TempVoiceChanId)
            && (Old.voiceChannelID === ch.id)
            && (Old.voiceChannel.members.size === 0);

      return Old.client.channels.cache
        .filter(filter)
        .forEach(ch => ch.delete());
    }
  },
};
