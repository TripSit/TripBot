import {
  TextChannel,
  VoiceState,
} from 'discord.js';
import { VoiceStateUpdateEvent } from '../@types/eventDef';
import {
  pitchTent, teardownTent, logTent, updateTentStatus,
} from '../utils/tents';

const F = f(__filename); // eslint-disable-line

function channelChangeMessage(oldState: VoiceState, newState: VoiceState): string {
  if (!oldState.channel) return `${newState.member?.displayName} joined ${newState.channel?.name}`;
  const departure = `${oldState.member?.displayName} left ${oldState.channel.name}`;
  return newState.channel ? `${departure} and joined ${newState.channel.name}` : departure;
}

export const voiceStateUpdate: VoiceStateUpdateEvent = {
  name: 'voiceStateUpdate',
  async execute(Old: VoiceState, New: VoiceState) {
    if (New.guild.id !== env.DISCORD_GUILD_ID) return; // Don't run on non-tripsit guilds
    if (New.member?.user?.bot) return; // Don't run on bots
    if (Old.member?.user?.bot) return; // Don't run on bots
    log.info(F, `${New.member?.displayName} changed voice state`);
    const channelAuditlog = await New.guild.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;

    // Mute, deafen and stream changes keep the same channel, so only a changed channel is a join, leave or move
    if (Old.channelId !== New.channelId) {
      channelAuditlog.send(channelChangeMessage(Old, New));
    }

    if (New.channelId === env.CHANNEL_CAMPFIRE) {
      // If the user joined the campfire channel, pitch a new tent
      pitchTent(Old, New);
      return;
    }

    // Check if the user actually left or joined a channel before logging
    if (New.channel !== Old.channel) {
      await logTent(Old, New);
      // Someone came or went, so refresh the headcount on both tents involved.
      if (Old.channel) updateTentStatus(Old.channel);
      if (New.channel) updateTentStatus(New.channel);
    }

    await teardownTent(Old);
  },
};

export default voiceStateUpdate;
