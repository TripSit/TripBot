import {
  Colors,
  VoiceState,
  VoiceBasedChannel,
  ChannelType,
  CategoryChannel,
  PermissionsBitField,
  Guild,
  GuildMember,
  GuildPremiumTier,
  EmbedBuilder,
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
  // const categoryVoice = await New.guild.channels.fetch(env.CATEGORY_VOICE) as VoiceBasedChannel;
  // const permissions = categoryVoice.permissionOverwrites.cache;

  function getMaxBitrate(guild: Guild): number {
    switch (guild.premiumTier) {
      case GuildPremiumTier.None:
        return 96000;
      case GuildPremiumTier.Tier1:
        return 128000;
      case GuildPremiumTier.Tier2:
        return 256000;
      case GuildPremiumTier.Tier3:
        return 384000;
      default:
        return 64000;
    }
  }

  New.member?.guild.channels.create({
    name: `⛺│${New.member.displayName}'s tent`,
    type: ChannelType.GuildVoice,
    parent: env.CATEGORY_VOICE,
    bitrate: getMaxBitrate(New.member.guild),
    userLimit: 8,
    permissionOverwrites: [
      {
        id: New.member.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.MoveMembers,
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
          PermissionsBitField.Flags.Connect,
        ],
      },
      {
        id: env.ROLE_NEEDSHELP,
        deny: [
          PermissionsBitField.Flags.ViewChannel,
        ],
      },
    ],
  }).then(async newChannel => {
    New.member?.voice.setChannel(newChannel.id);
    await newChannel.fetch();
    await newChannel.send(`## Welcome to your tent, <@${New.member?.id}>`);
    const embed = new EmbedBuilder()
      .setTitle('Tent pitched')
      .setColor(Colors.Green)
      .setDescription(`- **Looking for others to join?**
  - \`/tent ping\` - Use this to ping those opted-in to VC ping invites

- **Modify your tent**
  - \`/tent limit\` - Set a user limit
  - \`/tent level\` - Set a level requirement
  - \`/tent lock\`- Locks channel for all

- **Moderate your tent**
  - \`/tent add\` - Allow a user to join and see your tent, regardless of other settings
  - \`/tent ban\` - Prevents a user from joining or seeing your tent
  - \`/tent host\` - Transfer tent ownership to another user

*Note: Host will automatically transfer to the first person to join your tent if you are disconnected for more than 5 minutes.*

***To undo a command, just use it again.***`);
    await newChannel.send({ embeds: [embed] });
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
    if (channel.type === ChannelType.GuildVoice && channel.name.includes('⛺') && humans < 1) {
      channel.delete('Removing temporary voice chan!');
    }
  });
}

export async function transferTent(
  channel: VoiceBasedChannel,
  oldHost: GuildMember,
): Promise<void> {
  // Get the first user that joined that is still in the channel
  const newHost = channel.members.first();
  if (newHost) {
    const embed = new EmbedBuilder()
      .setTitle('Host transferred')
      .setColor(Colors.Blue)
      .setDescription(`
        The new host is ${newHost}.
        
        Note: Old hosts can still rejoin. (They will not be host)`);
    await channel.send({
      content: `<@${newHost.id}>`,
      embeds: [embed],
    });
  }

  // Remove the host permissions
  if (oldHost) {
    channel.permissionOverwrites.edit(oldHost.id, {
      MoveMembers: null, // Set to neutral
    });
  }

  // Add new host permissions
  if (newHost) {
    channel.permissionOverwrites.create(newHost.id, {
      Connect: true,
      MoveMembers: true,
    });
    // Rename the channel
    channel.setName(`⛺│${newHost.displayName}'s tent`);
  }
}

// Store timeouts for each channel to handle host rejoining
const hostTimeouts: { [channelId: string]: NodeJS.Timeout } = {};

const joinMessages = [
  'Hope you brought snacks!',
  'The marshmallows are crisp!',
  'The fire is warm!',
  'There is a comfy spot for you!',
  'Hope you brought a sleeping bag!',
  'Time to make some s\'mores!',
  'The stars are out tonight!',
  'Do you have any ghost stories?',
  'Do you have any campfire songs?',
  'Coffee or tea?',
];

const leaveMessages = [
  'I hope they had a good time!',
  'I think they forgot their glasses!',
  'I hope they can see in the dark!',
  'I hope they find their way back!',
  'Hopefully they brought a flashlight!',
  'They didn\'t even finish their tea!',
  'Did anyone see where they went?',
  'Gone but not forgotten!',
];

export async function logTent(
  Old: VoiceState,
  New: VoiceState,
): Promise<void> {
  let embed;

  log.debug(F, `${Old} ${New}`);

  // Helper function to check if a user has an explicit permission overwrite
  function hasExplicitPermission(channel: VoiceBasedChannel, member: GuildMember, permission: bigint): boolean {
    const overwrite = channel.permissionOverwrites.cache.get(member.id);
    return overwrite ? overwrite.allow.has(permission) : false;
  }

  // If the user left a tent and wasn't the last one
  if (Old.channel && Old.channel.name.includes('⛺') && Old.member && Old.channel && Old.channel.members.size >= 1) {
    log.debug(F, `Old.channel: ${Old.channel}`);
    // Check if the user that left was the host by checking explicit permissions
    if (hasExplicitPermission(Old.channel, Old.member as GuildMember, PermissionsBitField.Flags.MoveMembers)) {
      embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setDescription(`The host, ${Old.member} left!
        Host will transfer <t:${Math.floor(Date.now() / 1000) + 300}:R> if they don't return`);
      await Old.channel.send({ embeds: [embed] });

      // Set a timeout to transfer host after 5 minutes
      hostTimeouts[Old.channel.id] = setTimeout(async () => {
        if (Old.channel) {
          await transferTent(Old.channel, Old.member as GuildMember);
        }
      }, 300000); // 5 minutes in milliseconds
    } else {
      embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setDescription(`${Old.member} left the tent.
          *${leaveMessages[Math.floor(Math.random() * leaveMessages.length)]}*`);
      await Old.channel.send({ embeds: [embed] });
    }
  }

  // If the user joined a tent
  if (New.channel && New.channel.name.includes('⛺') && New.member) {
    log.debug(F, `New.channel: ${New.channel}`);
    log.debug(F, `List of members: ${New.channel.members.map(member => member.displayName)}`);

    // Check if the user that joined is the host by checking explicit permissions
    if (hasExplicitPermission(New.channel, New.member as GuildMember, PermissionsBitField.Flags.MoveMembers)) {
      // Clear the timeout if the host rejoined
      if (hostTimeouts[New.channel.id]) {
        clearTimeout(hostTimeouts[New.channel.id]);
        delete hostTimeouts[New.channel.id];
        embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setDescription(`The host, ${New.member}, has rejoined.
            Host transfer cancelled`);
        await New.channel.send({ embeds: [embed] });
      }
    } else {
      embed = new EmbedBuilder()
        .setColor(Colors.Green)
        .setDescription(`${New.member} joined the tent.
          *${joinMessages[Math.floor(Math.random() * joinMessages.length)]}*`);
      await New.channel.send({ embeds: [embed] });
    }
  }
}
