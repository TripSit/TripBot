import {
  TextChannel,
  VoiceState,
} from 'discord.js';
import { VoiceStateUpdateEvent } from '../@types/eventDef';
import { pitchTent, teardownTent } from '../utils/tents';

const F = f(__filename); // eslint-disable-line

export default voiceStateUpdate;

export const voiceStateUpdate: VoiceStateUpdateEvent = {
  name: 'voiceStateUpdate',
  async execute(Old: VoiceState, New: VoiceState) {
    if (New.guild.id !== env.DISCORD_GUILD_ID) return; // Dont run on non-tripsit guilds
    if (New.member?.user?.bot) return; // Dont run on bots
    if (Old.member?.user?.bot) return; // Dont run on bots
    log.info(F, `${New.member?.displayName} changed voice state`);

    const channelAuditlog = await New.guild.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    let modMessage = '';
    if (Old.channel) {
      if (New.channel) {
        modMessage = `${Old.member?.displayName} left ${Old.channel?.name} and joined ${New.channel?.name}`;
      } else {
        modMessage = `${Old.member?.displayName} left ${Old.channel?.name}`;
      }
    } else {
      modMessage = `${New.member?.displayName} joined ${New.channel?.name}`;
    }
    channelAuditlog.send(modMessage);

    if (New.channelId === env.CHANNEL_CAMPFIRE) {
      // If the user joined the campfire channel, pitch a new tent
      pitchTent(Old, New);
    }

    if (Old !== undefined) {
      // If the user left a channel, check if we need to tear down a tent
      teardownTent(Old);
    }
  },
};
