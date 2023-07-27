import {
  VoiceState,
  ChannelType,
  CategoryChannel,
  // PermissionsBitField,
  VoiceChannel,
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
  const categoryVoice = await New.guild.channels.fetch(env.CATEGORY_VOICE) as VoiceChannel;

  New.member?.guild.channels.create({
    name: `⛺│${New.member.displayName}'s tent`,
    type: ChannelType.GuildVoice,
    parent: env.CATEGORY_VOICE,
    permissionOverwrites: categoryVoice.permissionOverwrites.cache,
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

- **Moderate your tent with commands**
 - \`/voice lock\`- Locks your tent so no one else can join it
 - \`/voice hide\` - Hides your tent from the list of voice channels
 - \`/voice rename\` - Choose a new name for your tent
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

    // If the channel is a voice channel, and it's a tent, and there are no humans in it delete it
    if (channel.type === ChannelType.GuildVoice
      && channel.name.includes('⛺')
      && humans < 1) {
      channel.delete('Removing temporary voice chan!');
      // log.debug(F, `deleted an empty temporary voice channel`);
    }
  });
}
