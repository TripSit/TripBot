import {
  VoiceState,
  ChannelType,
  CategoryChannel,
} from 'discord.js';
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';
import * as path from 'path';
import {voiceEvent} from '../@types/eventDef';
const PREFIX = path.parse(__filename).name;

export const voiceStateUpdate: voiceEvent = {
  name: 'voiceStateUpdate',
  async execute(Old: VoiceState, New: VoiceState) {
    logger.debug(`[${PREFIX}] starting!`);
    if (New.member?.user?.bot) return;
    if (Old.member?.user?.bot) return;

    if (New.channelId === env.CHANNEL_TEMPVOICE) {
      console.log('user joinded tempvoice');
      New.member?.guild.channels.create({
        name: `⛺│${New.member.user.username}'s tent`,
        type: ChannelType.GuildVoice,
        parent: env.CATEGORY_TEMPVOICE,
      }).then((result) => {
        logger.debug(`[${PREFIX}] created a temporary voice channel`);
        New.member?.voice.setChannel(result.id);
        logger.debug(`[${PREFIX}] Moved user to the newly created voice channel`);
      });
    } else {
      console.log(`user joined channel ${New.channelId}, tempvoice is ${env.CHANNEL_TEMPVOICE}`);
    }

    try {
      if (Old !== undefined) {
        const tempVoiceCategory = Old.guild.channels.cache.get(env.CATEGORY_TEMPVOICE) as CategoryChannel;
        tempVoiceCategory.children.cache.forEach((channel) => {
          if (channel.type === ChannelType.GuildVoice) {
            if (channel.id !== env.CHANNEL_TEMPVOICE) {
              if (channel.members.size < 1) {
                channel.delete('beep boop, i love to clean up');
                logger.debug(`[${PREFIX}] deleted an empty temporary voice channel`);
              }
            }
          }
        });
      }
    } catch (err) {
      logger.debug(`[${PREFIX}] ${err}`);
    }
  },
};
