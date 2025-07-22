import type { TextChannel, VoiceState } from 'discord.js';

import type { VoiceStateUpdateEvent } from '../@types/eventDef';

import { logTent, pitchTent, teardownTent } from '../utils/tents';

const F = f(__filename);

export const voiceStateUpdate: VoiceStateUpdateEvent = {
  async execute(Old: VoiceState, New: VoiceState) {
    if (New.guild.id !== env.DISCORD_GUILD_ID) {
      return;
    } // Don't run on non-tripsit guilds
    if (New.member?.user?.bot) {
      return;
    } // Don't run on bots
    if (Old.member?.user?.bot) {
      return;
    } // Don't run on bots
    log.info(F, `${New.member?.displayName} changed voice state`);
    const channelAuditlog = (await New.guild.channels.fetch(env.CHANNEL_AUDITLOG)) as TextChannel;

    let moduleMessage = '';
    if (Old.channel) {
      moduleMessage = New.channel
        ? `${Old.member?.displayName} left ${Old.channel.name} and joined ${New.channel.name}`
        : `${Old.member?.displayName} left ${Old.channel.name}`;
    } else {
      moduleMessage = `${New.member?.displayName} joined ${New.channel?.name}`;
    }
    channelAuditlog.send(moduleMessage);

    if (New.channelId === env.CHANNEL_CAMPFIRE) {
      // If the user joined the campfire channel, pitch a new tent
      pitchTent(Old, New);
      return;
    }

    // Check if the user actually left or joined a channel before logging
    if (New.channel !== Old.channel) {
      logTent(Old, New);
    }

    teardownTent(Old);
  },
  name: 'voiceStateUpdate',
};

export default voiceStateUpdate;
