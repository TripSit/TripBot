import {
  VoiceState,
  VoiceChannel,
  ChannelType,
  CategoryChannel,
  PermissionsBitField,
  // VoiceChannel,
} from 'discord.js';
import {
  users,
  tentChannel,
} from '@prisma/client';

const F = f(__filename); // eslint-disable-line

async function createTentChannelData(memberId: string, channelId: string, mode: string, infoMessageId: string, banList: string[] = [], banMode: string) {
  // Fetch the user from the database
  const user = await db.users.findUnique({
    where: {
      discord_id: memberId,
    },
  });

  if (!user) {
    throw new Error(`User with Discord ID ${memberId} not found`);
  }

  // Create the tentChannel data
  return db.tentChannel.create({
    data: {
      userId: user.id,
      hostId: user.id,
      channelId,
      mode,
      infoMessageId,
      banList,
      banMode,
    },
  });
}

async function deleteTentChannelData(channelId: string) {
  const tentChannel = await db.tentChannel.findFirst({
    where: {
      channelId,
    },
  });

  if (tentChannel) {
    await db.tentChannel.delete({
      where: {
        id: tentChannel.id,
      },
    });
  }
}

async function getUserPermissions(userId: string) {
  // Fetch the user's data from the database
  const user = await db.users.findFirst({
    where: {
      discord_id: userId,
    },
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  return {
    preferredTentMode: user.preferredTentMode,
    banList: user.banList,
    banMode: user.preferredBanMode,
  };
}

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
  if (!New.member) {
    throw new Error('Member is undefined');
  }
  const userPermissions = await getUserPermissions(New.member.id);

  const permissionOverwrites = [
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
        ...(userPermissions.preferredTentMode !== ('hidden') ? [PermissionsBitField.Flags.ViewChannel] : []),
        ...(userPermissions.preferredTentMode !== ('locked' || 'hidden') ? [PermissionsBitField.Flags.Connect] : []),
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
      deny: [
        ...(userPermissions.preferredTentMode === ('hidden') ? [PermissionsBitField.Flags.ViewChannel] : []),
        ...(userPermissions.preferredTentMode === ('locked' || 'hidden') ? [PermissionsBitField.Flags.Connect] : []),
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
  ];

  userPermissions.banList.forEach(userId => {
    permissionOverwrites.push({
      id: userId,
      deny: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.Connect,
      ],
    });
  });

  New.member?.guild.channels.create({
    name: `⛺│${New.member.displayName}'s tent`,
    type: ChannelType.GuildVoice,
    parent: env.CATEGORY_VOICE,
    permissionOverwrites: [
      ...permissionOverwrites,
    ],
  }).then(async newChannel => {
    if (!New.member) {
      throw new Error('Member is undefined');
    }
    New.member?.voice.setChannel(newChannel.id);
    await newChannel.fetch();
    const infoMessage = await newChannel.send(`## Welcome to your tent, <@${New.member?.id}>

## **Current Tent Settings**
  - Creator: <@${New.member.id}>
  - Host: <@${New.member.id}>
  - Mode: ${userPermissions.preferredTentMode.charAt(0).toUpperCase() + userPermissions.preferredTentMode.slice(1)}
  - Ban List: ${userPermissions.banList.length > 0 ? userPermissions.banList.map(userId => `<@${userId}>`).join(', ') : 'None'}

## **Tent Info**
- **Webcam use is available for level 10 and up!**
 - Don't show off drugs, porn, gore, weapons or anything a reasonable person would consider offensive on camera.
 - Consumption of mildly psychoactive (nicotine, caffeine, alcohol, weed) substances is allowed.

- **Looking for others to join?**
 - \`/voice ping\` - Use this to ping those opted-in to VC ping invites

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
    // Add the tent to the temp database
    await createTentChannelData(New.member.id, newChannel.id, userPermissions.preferredTentMode, infoMessage.id, userPermissions.banList, userPermissions.banMode);
    // Log the tent data
    const tentData = await db.tentChannel.findFirst({
      where: {
        channelId: newChannel.id,
      },
    });
    log.debug(F, `${New.member.displayName}'s tent data: ${JSON.stringify(tentData)}`);
  });
}

export async function teardownTent(
  Old:VoiceState,
): Promise<void> {
  const tempVoiceCategory = await Old.guild.channels.fetch(env.CATEGORY_VOICE) as CategoryChannel;
  tempVoiceCategory.children.cache.forEach(channel => {
    // Get the number of humans in the channel
    const humans = channel.members.filter(member => !member.user.bot).size;

    // If the channel is a voice channel, and it's a tent, and there are no humans in it delete it
    if (channel.type === ChannelType.GuildVoice && channel.name.includes('⛺') && humans < 1) {
      channel.delete('Removing temporary voice chan!');
      // Remove the tent from the temp database
      deleteTentChannelData(channel.id);
    }
  });
}
