import {
  VoiceState,
  VoiceChannel,
  ChannelType,
  CategoryChannel,
  PermissionsBitField,
  // VoiceChannel,
} from 'discord.js';

const F = f(__filename); // eslint-disable-line

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
  // const categoryVoice = await New.guild.channels.fetch(env.CATEGORY_VOICE) as VoiceChannel;
  // const permissions = categoryVoice.permissionOverwrites.cache;

  New.member?.guild.channels.create({
    name: `⛺│${New.member.displayName}'s tent`,
    type: ChannelType.GuildVoice,
    parent: env.CATEGORY_VOICE,
    permissionOverwrites: [
      {
        id: New.member.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.Speak,
          PermissionsBitField.Flags.UseEmbeddedActivities,
          PermissionsBitField.Flags.UseVAD,
          // PermissionsBitField.Flags.MuteMembers,
          // PermissionsBitField.Flags.DeafenMembers,
          PermissionsBitField.Flags.MoveMembers,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.EmbedLinks,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.AddReactions,
          PermissionsBitField.Flags.UseExternalStickers,
          PermissionsBitField.Flags.UseExternalEmojis,
          PermissionsBitField.Flags.UseApplicationCommands,
        ],
      },
      {
        id: New.member.guild.roles.everyone,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.Speak,
          PermissionsBitField.Flags.UseEmbeddedActivities,
          PermissionsBitField.Flags.UseVAD,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.EmbedLinks,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.AddReactions,
          PermissionsBitField.Flags.UseExternalStickers,
          PermissionsBitField.Flags.UseExternalEmojis,
          PermissionsBitField.Flags.UseApplicationCommands,
        ],
      },
      {
        id: env.ROLE_MODERATOR,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
        ],
      },
      {
        id: env.ROLE_NEEDSHELP,
        deny: [
          PermissionsBitField.Flags.ViewChannel,
        ],
      },
      {
        id: env.ROLE_VERIFYING,
        deny: [
          PermissionsBitField.Flags.ViewChannel,
        ],
      },
      {
        id: env.ROLE_UNVERIFIED,
        deny: [
          PermissionsBitField.Flags.ViewChannel,
        ],
      },

    ],
  }).then(async newChannel => {
    New.member?.voice.setChannel(newChannel.id);
    await newChannel.fetch();
    await newChannel.send(`## Welcome to your tent, <@${New.member?.id}>

- **Webcam Chat (WC) is available for level 10 and up!**
 - The normal rules are still in effect:
 - Don't show off drugs, porn, gore, weapons or anything a reasonable person would consider offensive on camera.
 - Consumption of mild psychoactive (nicotine, caffeine, alcohol, weed) substances is allowed.

- **Looking for others to join?**
 - Pick up the 'Voice Chatty' role in <id:customize>
 - This icon indicates you're looking for joiners in chat
 - You can (infrequently) mention the \`@Join VC\` role to see if anyone wants to join!
 - You can pick up this role in <id:customize>

- **Modify your tent**
 - \`/voice bitrate\` - Change the bitrate of your tent
 - \`/voice rename\` - Choose a new name for your tent

- **Moderate your tent**
 - \`/voice lock\`- Locks your tent so no one else can join it
 - \`/voice hide\` - Hides your tent from the list of voice channels
 - \`/voice mute\` - Mutes a user for everyone in your tent
 - \`/voice ban\` - Bans a user from joining and seeing your tent
 - \`/voice cohost\` - Allows another user to use these commands
***To undo a command, just use it again.***`);
    // await newChannel.send({ embeds: [embed] });
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
  const tempVoiceCategory = await Old.guild.channels.fetch(env.CATEGORY_VOICE) as CategoryChannel;
  tempVoiceCategory.children.cache.forEach(channel => {
    // Get the number of humans in the channel
    const humans = channel.members.filter(member => !member.user.bot).size;

    const radioChannels: { [key: string]: string } = {
      '830530156048285716': env.CHANNEL_LOFIRADIO,
      '861363156568113182': env.CHANNEL_JAZZRADIO,
      '833406944387268670': env.CHANNEL_SYNTHWAVERADIO,
      '831623165632577587': env.CHANNEL_SLEEPYRADIO,
    };

    // If the channel is a voice channel, and it's a tent, and there are no humans in it delete it
    if (channel.type === ChannelType.GuildVoice && channel.name.includes('⛺') && humans < 1) {
      // Check if the current channel has a radio bot in it
      // Checkif any bots in the channel are in the radioChannels object
      const botMember = channel.members.find(member => member.user.bot
        && Object.keys(radioChannels).includes(member.user.id));
      if (botMember) {
        // If it does, find the corresponding radio channel from the bot id and move the bot to it
        const radioChannelId = radioChannels[botMember.user.id];
        // Get the radio channel from cache
        const radioChannel = Old.guild.channels.cache.get(radioChannelId) as VoiceChannel;
        // If the radio channel exists, and is a voice channel, move the bot to it
        if (radioChannel && radioChannel.type === ChannelType.GuildVoice) {
          channel.members.forEach(member => {
            if (member.user.bot) {
              member.voice.setChannel(radioChannel.id);
            }
          });
        }
      }
      channel.delete('Removing temporary voice chan!');
    }
  });
}
