import {
  VoiceState,
  ChannelType,
  CategoryChannel,
  // GuildMember,
  PermissionsBitField,
  EmbedBuilder,
  Colors,
  TextChannel,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { embedTemplate } from '../utils/embedTemplate';

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
    name: `⛺│ REAL ${New.member.displayName}'s tent`,
    type: ChannelType.GuildVoice,
    parent: env.CATEGORY_CAMPGROUND,
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
        id: env.ROLE_VERIFIED,
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
    ],
  }).then(async newChannel => {
    New.member?.voice.setChannel(newChannel.id);
    // const embed = embedTemplate()
    //   .setAuthor(null)
    //   .setColor(env.Colors_Green)
    //   .setTitle('Commands for your tent')
    //   .setDescription(` To undo a command, just type it again.
    //   **/voice lock** - Locks your tent so no one else can join it
    //   **/voice hide** - Hides your tent from the list of voice channels
    //   **/voice rename** - Changes the name of your tent
// 
    //   **/voice mute @user** - Mutes a user for everyone in your tent
    //   **/voice ban @user** - Bans a user from joining and seeing your tent
    //   **/voice cohost @user** - Allows another user to use these commands
    //   `);
    newChannel = await newChannel.fetch();
    await newChannel.send(`Welcome to your tent <@${New.member?.id}>!
Manage your tent:

**/voice lock** - Locks your tent so no one else can join it
**/voice hide** - Hides your tent from the list of voice channels
**/voice rename** - Changes the name of your tent
**/voice mute @user** - Mutes a user for everyone in your tent
**/voice ban @user** - Bans a user from joining and seeing your tent
**/voice cohost @user** - Allows another user to use these commands
To undo a command, just type it again.`);
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
