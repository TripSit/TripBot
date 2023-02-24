import {
  VoiceState,
  ChannelType,
  CategoryChannel,
  // GuildMember,
  PermissionsBitField,
} from 'discord.js';

// const F = f(__filename);

/**
 * Template
 * @param {VoiceState} Old The previous voice state
 * @param {VoiceState} New The current voice state
 * @return {Promise<void>}
* */
export async function pitchTent(
  Old:VoiceState,
  New:VoiceState,
): Promise<void> {
  New.member?.guild.channels.create({
    name: `⛺│${New.member.displayName}'s tent`,
    type: ChannelType.GuildVoice,
    parent: env.CATEGORY_CAMPGROUND,
    permissionOverwrites: [
      { id: New.member.id, 
        allow: [
        PermissionsBitField.Flags.MuteMembers,
        PermissionsBitField.Flags.DeafenMembers,
        PermissionsBitField.Flags.MoveMembers,
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.ViewChannel,
      ] },
    ],
  }).then(newChannel => {
    New.member?.voice.setChannel(newChannel.id);
    // newChannel.permissionOverwrites.set([
    //   {
    //     id: New.member as GuildMember,
    //     allow: [
    //       // PermissionsBitField.Flags.MuteMembers,
    //       // PermissionsBitField.Flags.MoveMembers,
    //       // PermissionsBitField.Flags.DeafenMembers,
    //     ],
    //   },
    // ]);
  });
}

/**
 * Template
 * @param {VoiceState} Old The previous voice state
 * @param {VoiceState} New The current voice state
 * @return {Promise<void>}
* */
export async function teardownTent(
  Old:VoiceState,
): Promise<void> {
  const tempVoiceCategory = await Old.guild.channels.fetch(env.CATEGORY_CAMPGROUND) as CategoryChannel;
  tempVoiceCategory.children.cache.forEach(channel => {
    // Get the number of humans in the channel
    const humans = channel.members.filter(member => !member.user.bot).size;

    // If the channel is a voice channel, and it's not the campfire, and there are no humans in it delete it
    if (channel.type === ChannelType.GuildVoice
      && channel.id !== env.CHANNEL_CAMPFIRE
      && humans < 1) {
      channel.delete('Removing temporary voice chan!');
      // log.debug(F, `deleted an empty temporary voice channel`);
    }
  });
}
