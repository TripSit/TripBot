import {
  VoiceState,
  ChannelType,
  CategoryChannel,
} from 'discord.js';
import env from '../../global/utils/env.config';
import log from '../../global/utils/log';
import * as path from 'path';
import {voiceEvent} from '../@types/eventDef';
const PREFIX = path.parse(__filename).name;

export const voiceStateUpdate: voiceEvent = {
  name: 'voiceStateUpdate',
  async execute(Old: VoiceState, New: VoiceState) {
    // log.debug(`[${PREFIX}] starting!`);
    if (New.guild.id !== env.DISCORD_GUILD_ID) return;
    if (New.member?.user?.bot) return;
    if (Old.member?.user?.bot) return;

    log.debug(`[${PREFIX}] Tempvoice channel is is ${env.CHANNEL_CAMPFIRE}`);

    log.debug(`[${PREFIX}] ${New.member?.displayName} ${New.channelId ?
      `joined channel ${New.channel?.name} (${New.channelId})` :
      `left channel ${Old.channel?.name} (${Old.channelId})`} `);

    if (New.channelId === env.CHANNEL_CAMPFIRE) {
      console.log('user joinded tempvoice');
      New.member?.guild.channels.create({
        name: `⛺│${New.member.displayName}'s tent`,
        type: ChannelType.GuildVoice,
        parent: env.CATEGORY_CAMPFIRE,
      }).then((result) => {
        log.debug(`[${PREFIX}] created a temporary voice channel for ${New.member?.displayName}`);
        New.member?.voice.setChannel(result.id);
        log.debug(`[${PREFIX}] Moved ${New.member?.displayName} to the newly created voice channel`);
      });
    }

    try {
      if (Old !== undefined) {
        const tempVoiceCategory = Old.guild.channels.cache.get(env.CATEGORY_CAMPFIRE) as CategoryChannel;
        tempVoiceCategory.children.cache.forEach((channel) => {
          if (channel.type === ChannelType.GuildVoice) {
            if (channel.id !== env.CHANNEL_CAMPFIRE) {
              if (channel.members.size < 1) {
                channel.delete('beep boop, i love to clean up');
                log.debug(`[${PREFIX}] deleted an empty temporary voice channel`);
              }
            }
          }
        });
      }
    } catch (err) {
      log.debug(`[${PREFIX}] ${err}`);
    }
  },
};
