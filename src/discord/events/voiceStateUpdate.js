'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

const {
  TempVoiceChanId,
  TempVoiceCatId,
} = require('../../../env');

module.exports = {
  name: 'voiceStateUpdate',

  async execute(Old, New) {
    if (New.member.bot) return;
    if (Old.member.bot) return;

    if (New.channelId === TempVoiceChanId) {
      New.member.guild.channels.create(`⛺│${New.member.user.username}'s tent`, {
        type: 2,
        parent: TempVoiceCatId,
      }).then(result => {
        logger.debug(`[${PREFIX}] created a temporary voice channel`);
        New.member.voice.setChannel(result.id);
        logger.debug(`[${PREFIX}] Moved user to the newly created voice channel`);
      });
    }

    try {
      Old.client.channels.cache.get(TempVoiceCatId).children.forEach(channel => {
        if (channel.type === 'GUILD_VOICE') {
          if (channel.id !== TempVoiceChanId) {
            if (channel.members.size < 1) {
              channel.delete('beep boop, i love to clean up');
              logger.debug(`[${PREFIX}] deleted an empty temporary voice channel`);
            }
          }
        }
      });
    } catch (err) {
      logger.debug(`[${PREFIX}] ${err}`);
    }
  },
};
