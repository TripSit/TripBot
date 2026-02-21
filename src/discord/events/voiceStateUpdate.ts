import {
  TextChannel,
  VoiceState,
} from 'discord.js';
import { VoiceStateUpdateEvent } from '../@types/eventDef';
import { pitchTent, teardownTent, logTent } from '../utils/tents';

const F = f(__filename); // eslint-disable-line

export const voiceStateUpdate: VoiceStateUpdateEvent = {
  name: 'voiceStateUpdate',
  async execute(Old: VoiceState, New: VoiceState) {
    if (New.guild.id !== env.DISCORD_GUILD_ID) return; // Don't run on non-tripsit guilds
    if (New.member?.user?.bot) return; // Don't run on bots
    if (Old.member?.user?.bot) return; // Don't run on bots
    log.info(F, `${New.member?.displayName} changed voice state`);
    const channelAuditlog = await New.guild.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    let modMessage = '';
    if (Old.channel) {
      if (New.channel) {
        modMessage = `${Old.member?.displayName} left ${Old.channel.name} and joined ${New.channel.name}`;
      } else {
        modMessage = `${Old.member?.displayName} left ${Old.channel.name}`;
      }
    } else {
      modMessage = `${New.member?.displayName} joined ${New.channel?.name}`;
    }
    channelAuditlog.send(modMessage);

    if (New.channelId === env.CHANNEL_CAMPFIRE) {
      // If the user joined the campfire channel, pitch a new tent
      pitchTent(Old, New);
      return;
    }

    // Check if the user actually left or joined a channel before logging
    if (New.channel !== Old.channel) {
      await logTent(Old, New);
    }

    await teardownTent(Old);
  },
};

export default voiceStateUpdate;
