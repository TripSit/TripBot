/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  // Guild,
  Colors,
  SlashCommandBuilder,
  GuildMember,
  PermissionsBitField,
  EmbedBuilder,
  VoiceBasedChannel,
  TextChannel,
  Message,
  VoiceState,
  ChannelType,
  CategoryChannel,
  ChatInputCommandInteraction,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';

const F = f(__filename);

type VoiceActions = 'private' | 'ban' | 'whitelist' | 'rename' | 'cohost' | 'ping' | 'settings';

// Command that makes the bot ping the Join VC role
let lastTentPingTime = Date.now() - 3600000; // Initialize to one hour ago
const userTentPingTimes: { [userId: string]: number } = {}; // Initialize an empty object to store user ping times
const globalCoolDown = 3600000; // 1 hour
const userCoolDown = 10800000; // 3 hours

namespace util {
  export async function pitchTent(
    oldState:VoiceState,
    newState:VoiceState,
  ): Promise<void> {
    // const categoryVoice = await New.guild.channels.fetch(env.CATEGORY_VOICE) as VoiceChannel;
    // const permissions = categoryVoice.permissionOverwrites.cache;
    if (!newState.member) return;
    const userData = await db.users.upsert({
      where: { discord_id: newState.member.id },
      create: { discord_id: newState.member.id },
      update: {},
    });

    let tentData = await db.tent_settings.findFirst({
      where: {
        created_by: userData.id,
      },
    });

    if (!tentData) {
      tentData = await db.tent_settings.create({
        data: {
          name: newState.member.displayName,
          created_by: userData.id,
          mode: 'PUBLIC',
          updated_by: userData.id,
        },
      });
    }

    if (!tentData) return;

    const permissionOverwrites = [
      {
        id: newState.member.id,
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
        id: newState.member.guild.roles.everyone,
        allow: [
          ...(tentData.mode === ('PUBLIC') ? [PermissionsBitField.Flags.ViewChannel] : []),
          ...(tentData.mode === ('PUBLIC') ? [PermissionsBitField.Flags.Connect] : []),
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
          ...(tentData.mode === ('PRIVATE') ? [PermissionsBitField.Flags.ViewChannel] : []),
          ...(tentData.mode === ('PRIVATE') ? [PermissionsBitField.Flags.Connect] : []),
        ],
      },
      {
        id: env.ROLE_MODERATOR as string,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
        ],
      },
      {
        id: env.ROLE_NEEDSHELP as string,
        deny: [
          PermissionsBitField.Flags.ViewChannel,
        ],
      },
      {
        id: env.ROLE_VERIFYING as string,
        deny: [
          PermissionsBitField.Flags.ViewChannel,
        ],
      },
      {
        id: env.ROLE_UNVERIFIED as string,
        deny: [
          PermissionsBitField.Flags.ViewChannel,
        ],
      },
    ];

    // Get the blacklist
    const tentBanList = await db.tent_blacklist.findMany({
      where: {
        tent_id: tentData.id,
      },
      select: {
        user: {
          select: {
            discord_id: true,
          },
        },
      },
    });
    if (tentBanList.length > 0) {
      permissionOverwrites.push(...tentBanList.map(ban => ({
        id: ban.user.discord_id as string,
        deny: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
        ],
      })));
    }

    // Get the whitelist
    const tentWhiteList = await db.tent_blacklist.findMany({
      where: {
        tent_id: tentData.id,
      },
      select: {
        user: {
          select: {
            discord_id: true,
          },
        },
      },
    });
    if (tentWhiteList.length > 0) {
      tentWhiteList.forEach(ban => {
        permissionOverwrites.push({
          id: ban.user.discord_id as string,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Connect,
          ],
        });
      });

      permissionOverwrites.push(...tentBanList.map(ban => ({
        id: ban.user.discord_id as string,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
        ],
      })));
    }

    const newChannel = await newState.member?.guild.channels.create({
      name: await util.tentName(`${newState.member.displayName}'s tent`),
      type: ChannelType.GuildVoice,
      parent: env.CATEGORY_VOICE,
      permissionOverwrites: [
        ...permissionOverwrites,
      ],
    });

    await newState.member.voice.setChannel(newChannel.id);
    await newChannel.fetch();
    const infoMessage = await newChannel.send(`## Welcome to your tent, <@${newState.member?.id}>
      
      ## **Current Tent Settings**
        - Creator: <@${newState.member.id}>
        - Host: <@${newState.member.id}>
        - Mode: ${tentData.mode.charAt(0).toUpperCase() + tentData.mode.slice(1).toLowerCase()}
      
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
    // Add the tent to the database
    if (tentData) {
      await db.tent_settings.update({
        where: {
          id: tentData.id,
        },
        data: {
          channel_id: newChannel.id,
          info_message_id: infoMessage.id,
        },
      });
    } else {
      await db.tent_settings.create({
        data: {
          name: newChannel.name,
          channel_id: newChannel.id,
          info_message_id: infoMessage.id,
          created_by: userData.id,
          mode: 'PUBLIC',
          updated_by: userData.id,
        },
      });
    }

    // Log the tent data
    log.debug(F, `${newState.member.displayName}'s tent data: ${JSON.stringify(tentData)}`);
  }

  export async function teardownTent(
    Old:VoiceState,
  ): Promise<void> {
    const tempVoiceCategory = await Old.guild.channels.fetch(env.CATEGORY_VOICE) as CategoryChannel;
    await Promise.all(tempVoiceCategory.children.cache.map(async channel => {
      // Get the number of humans in the channel
      const humans = channel.members.filter(member => !member.user.bot).size;

      // If the channel is a voice channel, and it's a tent, and there are no humans in it delete it
      if (channel.type === ChannelType.GuildVoice && channel.name.includes('⛺') && humans < 1) {
        await channel.delete('Removing temporary voice chan!');
        // Remove the channel from the database
        const tentData = await db.tent_settings.findFirst({
          where: {
            channel_id: channel.id,
          },
          select: {
            id: true,
          },
        });
        if (tentData) {
          await db.tent_settings.update({
            where: {
              id: tentData.id,
            },
            data: {
              channel_id: null,
              info_message_id: null,
              deleted_at: new Date(),
            },
          });
        }
      }
    }));
  }

  export async function tentName(
    name:string,
  ):Promise<string> {
    return `⛺│${name}`;
  }
}

namespace cmd {
  export async function tentRename(
    interaction:ChatInputCommandInteraction,
  ):Promise<EmbedBuilder> {
    const voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceBasedChannel;
    const newName = interaction.options.getString('name') as string;
    const actor = interaction.member as GuildMember;

    const userData = await db.users.upsert({
      where: { discord_id: actor.id },
      create: { discord_id: actor.id },
      update: {},
    });

    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: voiceChannel.id,
      },
    });

    await db.tent_settings.update({
      where: {
        id: tentData.id,
      },
      data: {
        name: newName,
        updated_by: userData.id,
      },
    });

    await voiceChannel.setName(await util.tentName(newName));

    log.debug(F, `${voiceChannel.name} has been named to ${newName}`);

    return embedTemplate()
      .setTitle('Success')
      .setColor(Colors.Green)
      .setDescription(`${voiceChannel.name} has been renamed to ${newName}`);
  }

  export async function tentPrivate(
    interaction:ChatInputCommandInteraction,
  ): Promise<EmbedBuilder> {
    const voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceBasedChannel;
    // let verb = '';
    let mode = '';
    let explanation = '';

    // Fetch the tentChannel data from the database
    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: voiceChannel.id,
      },
    });

    if (tentData.mode === 'PUBLIC') {
      voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { ViewChannel: true, Connect: true });
      // verb = 'unhidden (and unlocked)';
      mode = 'PUBLIC';
      explanation = 'The tent is visible and can be joined by anyone not on your ban list.';

      // Update the tentChannel mode in the database
      await db.tent_settings.update({
        where: {
          id: tentData.id,
        },
        data: {
          mode: 'PUBLIC',
        },
      });
    } else {
      voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { ViewChannel: false, Connect: false });
      // verb = 'hidden (and locked)';
      mode = 'private';
      explanation = 'Tent is hidden from the channel list and only users on your whitelist can join.';

      // Update the tentChannel mode in the database
      await db.tent_settings.update({
        where: {
          id: tentData.id,
        },
        data: {
          mode: 'PRIVATE',
        },
      });
    }

    // Edit the info message with the new mode
    if (tentData.info_message_id) {
      let infoMessage = null as null | Message;
      try {
        infoMessage = await voiceChannel.messages.fetch(tentData.info_message_id);
      } catch (e) {
      // Message was likely deleted, should we re-send it in chat?
      }
      if (infoMessage) {
      // Update the info message with the new mode using regex
        const newContent = infoMessage.content
          .replace(/Mode: .*/, `Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
        infoMessage.edit(newContent);
      }
    }

    // log.debug(F, `Channel is now ${verb}`);
    return embedTemplate()
      .setTitle(`Mode set to **${mode}**`)
      .setColor(Colors.Green)
      .setDescription(`${explanation}`);
  }

  export async function tentBan(
    interaction:ChatInputCommandInteraction,
  ): Promise<EmbedBuilder> {
    if (await validate.actingOnSelf(interaction)) {
      return embedTemplate()
        .setTitle('Error')
        .setColor(Colors.Red)
        .setDescription('You cannot ban yourself');
    }

    const voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceBasedChannel;

    // Fetch the tentChannel data from the database
    const tentChannel = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: voiceChannel.id,
      },
    });

    const target = interaction.options.getMember('target') as GuildMember;
    const targetData = await db.users.upsert({
      where: { discord_id: target.id },
      create: { discord_id: target.id },
      update: {},
    });

    const tentBanData = await db.tent_blacklist.findFirst({
      where: {
        tent_id: tentChannel.id,
        user_id: targetData.id,
      },
    });

    // Check if the target user is already banned or not
    let verb = '';
    if (tentBanData) {
      // If the target user is already banned, remove them from the ban list
      await voiceChannel.permissionOverwrites.delete(target);
      verb = 'removed from your ban list';

      await db.tent_blacklist.delete({
        where: {
          tent_id_user_id: {
            tent_id: tentChannel.id,
            user_id: targetData.id,
          },
        },
      });
    } else {
      // If not, add the target user to the ban list
      await voiceChannel.permissionOverwrites.edit(target, { ViewChannel: false, Connect: false });
      if (target.voice.channel === voiceChannel) {
        target.voice.setChannel(null);
      }
      verb = 'added to your ban list and disconnected';

      await db.tent_blacklist.create({
        data: {
          tent_id: tentChannel.id,
          user_id: targetData.id,
        },
      });
    }

    // log.debug(F, `${target.displayName} is now ${verb}`);

    return embedTemplate()
      .setTitle('Success')
      .setColor(Colors.Green)
      .setDescription(`${target} has been ${verb}`);
  }

  export async function tentWhitelist(
    interaction:ChatInputCommandInteraction,
  ): Promise<EmbedBuilder> {
    if (await validate.actingOnSelf(interaction)) {
      return embedTemplate()
        .setTitle('Error')
        .setColor(Colors.Red)
        .setDescription('You cannot whitelist yourself');
    }

    const voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceBasedChannel;

    // Fetch the tentChannel data from the database
    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: voiceChannel.id,
      },
    });

    const target = interaction.options.getMember('target') as GuildMember;
    // Fetch the user data from the database
    const targetData = await db.users.upsert({
      where: { discord_id: target.id },
      create: { discord_id: target.id },
      update: {},
    });

    const tentWhiteListData = await db.tent_whitelist.findFirst({
      where: {
        tent_id: tentData.id,
        user_id: targetData.id,
      },
    });

    let verb = '';
    if (tentWhiteListData) {
      await voiceChannel.permissionOverwrites.delete(target);
      verb = 'removed from your white list';

      await db.tent_whitelist.delete({
        where: {
          tent_id_user_id: {
            tent_id: tentData.id,
            user_id: targetData.id,
          },
        },
      });
    } else {
      await voiceChannel.permissionOverwrites.edit(target, { ViewChannel: true, Connect: true });
      verb = 'added to your white list';

      await db.tent_whitelist.create({
        data: {
          tent_id: tentData.id,
          user_id: targetData.id,
        },
      });
    }

    // Return an embed with the result
    return embedTemplate()
      .setTitle('Success')
      .setColor(Colors.Green)
      .setDescription(`${target} has been ${verb}`);
  }

  export async function tentCohost(
    interaction:ChatInputCommandInteraction,
  ):Promise<EmbedBuilder> {
    if (await validate.actingOnSelf(interaction)) {
      return embedTemplate()
        .setTitle('Error')
        .setColor(Colors.Red)
        .setDescription('You cannot make yourself a cohost!');
    }

    const voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceBasedChannel;

    // Fetch the tentChannel data from the database
    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: voiceChannel.id,
      },
    });

    const target = interaction.options.getMember('target') as GuildMember;
    // Fetch the user data from the database
    const targetData = await db.users.upsert({
      where: { discord_id: target.id },
      create: { discord_id: target.id },
      update: {},
    });

    const tentHostData = await db.tent_hostlist.findFirst({
      where: {
        tent_id: tentData.id,
        user_id: targetData.id,
      },
    });

    let verb = '';
    if (tentHostData) {
      await voiceChannel.permissionOverwrites.edit(target, { MoveMembers: false });
      verb = 'removed as a co-host';

      await db.tent_whitelist.delete({
        where: {
          tent_id_user_id: {
            tent_id: tentData.id,
            user_id: targetData.id,
          },
        },
      });
    } else {
      await voiceChannel.permissionOverwrites.edit(target, { MoveMembers: true });
      verb = 'co-hosted';

      await db.tent_whitelist.create({
        data: {
          tent_id: tentData.id,
          user_id: targetData.id,
        },
      });
    }

    // log.debug(F, `${target.displayName} is now ${verb}`);

    return embedTemplate()
      .setTitle('Success')
      .setColor(Colors.Green)
      .setDescription(`${target} has been ${verb} in ${voiceChannel.name}`);
  }

  export async function tentPing(
    interaction:ChatInputCommandInteraction,
  ): Promise<EmbedBuilder> {
    const member = interaction.member as GuildMember;
    const voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceBasedChannel;
    const role = await voiceChannel.guild.roles.fetch(env.ROLE_JOINVC);
    if (role) {
      const now = Date.now();
      const userId = member.id;

      // Check if the user used the command less than the user cool down
      if (userTentPingTimes[userId] && now - userTentPingTimes[userId] < userCoolDown) {
        return embedTemplate()
          .setTitle('Cool Down')
          .setColor(Colors.Red)
          .setDescription(`You already used this command <t:${Math.floor(userTentPingTimes[userId] / 1000)}:R>. 
        You can use it again <t:${Math.floor((userTentPingTimes[userId] + userCoolDown) / 1000)}:R>.`);
      }

      // Check if the command was used less than the global cool down
      if (now - lastTentPingTime < globalCoolDown) {
        return embedTemplate()
          .setTitle('Cool Down')
          .setColor(Colors.Red)
          .setDescription(`This command is on cool down. 
          It can next be used <t:${Math.floor((lastTentPingTime + globalCoolDown) / 1000)}:R>.`);
      }

      // Ping the role
      // Get the lounge channel
      const channel = await member.guild.channels.fetch(env.CHANNEL_LOUNGE) as TextChannel;
      if (!channel || !channel.isTextBased()) {
        return embedTemplate()
          .setTitle('Error')
          .setColor(Colors.Red)
          .setDescription('The lounge channel could not be found.');
      }

      // Send the ping
      await channel.send(`<@${member.id}> wants you to <@&${role.id}> in ${voiceChannel.name}!`);

      // Update the last usage times
      lastTentPingTime = now;
      userTentPingTimes[userId] = now;

      // Send the confirmation message
      return embedTemplate()
        .setTitle('Success')
        .setColor(Colors.Green)
        .setDescription('The Join VC role has been pinged. ');
    }

    return embedTemplate()
      .setTitle('Error')
      .setColor(Colors.Red)
      .setDescription('The Join VC role could not be found.');
  }

  export async function tentSettings(
    interaction:ChatInputCommandInteraction,
  ) {
    const member = interaction.member as GuildMember;
    // Fetch the user's data from the database
    const userData = await db.users.upsert({
      where: { discord_id: member.id },
      create: { discord_id: member.id },
      update: {},
    });

    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        created_by: userData.id,
      },
    });

    const tentBanList = await db.tent_blacklist.findMany({
      where: {
        tent_id: tentData.id,
      },
      select: {
        user: {
          select: {
            discord_id: true,
          },
        },
      },
    });

    const tentWhiteList = await db.tent_blacklist.findMany({
      where: {
        tent_id: tentData.id,
      },
      select: {
        user: {
          select: {
            discord_id: true,
          },
        },
      },
    });

    // Show embed with ban list
    return embedTemplate()
      .setTitle('Tent Settings')
      .setColor(Colors.Blue)
      .setDescription(stripIndents`
        Ban List: ${tentBanList.map(ban => `<@${ban.user.discord_id}>`).join(', ')}
        White List: ${tentWhiteList.map(whitelist => `<@${whitelist.user.discord_id}>`).join(', ')}
        Mode: ${tentData.mode.charAt(0).toUpperCase() + tentData.mode.slice(1).toLowerCase()}
      `);
  }
}

namespace validate {
  export async function inGuild(
    interaction:ChatInputCommandInteraction,
  ):Promise<boolean> {
    if (!interaction.member || !interaction.guild || !interaction.channel) {
      await interaction.reply({ content: 'You can only do this command in the guild', ephemeral: true });
      return false;
    }
    return true;
  }

  export async function inVoiceChannel(
    interaction:ChatInputCommandInteraction,
  ):Promise<boolean> {
    if (!(interaction.member as GuildMember).voice.channel) {
      await interaction.reply({ content: 'You must be in a voice channel to use this command', ephemeral: true });
      return false;
    }
    return true;
  }

  export async function isTentOwnerOrHost(
    interaction:ChatInputCommandInteraction,
  ):Promise<boolean> {
    const voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceBasedChannel;
    const tentChannel = await db.tent_settings.findFirst({
      where: {
        channel_id: voiceChannel.id,
        created_by: (interaction.member as GuildMember).id,
      },
    });

    if (!tentChannel) {
      // If they're not the owner, check if they're in the host list
      const hostChannel = await db.tent_settings.findFirst({
        where: {
          channel_id: voiceChannel.id,
          hostlist: {
            some: {
              user_id: (interaction.member as GuildMember).id,
            },
          },
        },
      });

      if (!hostChannel) {
        await interaction.reply({ content: 'You must be a co-host of the tent to use this command', ephemeral: true });
        return false;
      }

      return true;
    }
    return true;
  }

  export async function actingOnSelf(
    interaction:ChatInputCommandInteraction,
  ):Promise<boolean> {
    const target = interaction.options.getMember('target') as GuildMember;
    if (target === interaction.member) {
      await interaction.reply({ content: 'Stop playing with yourself!', ephemeral: true });
      return true;
    }
    return false;
  }

  export async function actingOnMod(
    interaction:ChatInputCommandInteraction,
  ):Promise<boolean> {
    const target = interaction.options.getMember('target') as GuildMember;
    if (target.roles.cache.has(env.ROLE_MODERATOR)) {
      await interaction.reply({ content: 'You cannot do that to a moderator!', ephemeral: true });
      return true;
    }
    return false;
  }
}

export async function voiceUpdate(
  New: VoiceState,
  Old: VoiceState,
): Promise<void> {
  // This is activated via voiceStateUpdate.ts
  if (New.channelId === env.CHANNEL_CAMPFIRE) {
    // If the user joined the campfire channel, pitch a new tent
    util.pitchTent(Old, New);
    return;
  }

  util.teardownTent(Old);
}

export const dVoice: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Control your Campfire Tent')
    .addSubcommand(subcommand => subcommand
      .setName('rename')
      .setDescription('Rename your Tent')
      .addStringOption(option => option
        .setName('name')
        .setDescription('The new name for your Tent')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('private')
      .setDescription('Hide and lock the Tent'))
    .addSubcommand(subcommand => subcommand
      .setName('ban')
      .setDescription('Add a user to your Tent ban list')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to ban/unban')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('whitelist')
      .setDescription('Add a user to your Tent whitelist')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to add/remove')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('cohost')
      .setDescription('Make another user able to use /voice commands')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to make co-host')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('ping')
      .setDescription('Ping the Join VC role'))
    .addSubcommand(subcommand => subcommand
      .setName('settings')
      .setDescription('View and change your Tent settings')),

  async execute(interaction) {
    if (!(await validate.inGuild(interaction))) return false;
    if (!(await validate.inVoiceChannel(interaction))) return false;
    if (!(await validate.isTentOwnerOrHost(interaction))) return false;
    if (await validate.actingOnSelf(interaction)) return false;
    if (await validate.actingOnMod(interaction)) return false;

    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });

    const embed = embedTemplate().setTitle('Error').setColor(Colors.Red);

    const command = interaction.options.getSubcommand() as VoiceActions;
    switch (command) {
      case 'rename':
        await interaction.editReply({ embeds: [await cmd.tentRename(interaction)] });
        return true;
      case 'private':
        await interaction.editReply({ embeds: [await cmd.tentPrivate(interaction)] });
        return true;
      case 'ban':
        await interaction.editReply({ embeds: [await cmd.tentBan(interaction)] });
        return true;
      case 'whitelist':
        await interaction.editReply({ embeds: [await cmd.tentWhitelist(interaction)] });
        return true;
      case 'cohost':
        await interaction.editReply({ embeds: [await cmd.tentCohost(interaction)] });
        return true;
      case 'ping':
        await interaction.editReply({ embeds: [await cmd.tentPing(interaction)] });
        return true;
      case 'settings':
        await interaction.editReply({ embeds: [await cmd.tentSettings(interaction)] });
        return true;
      default:
        await interaction.editReply({ embeds: [embed.setDescription('Invalid command')] });
        return false;
    }
  },
};

export default dVoice;

// async function transferHost(oldHostId: string, newHostId: string, channelId: string) {
//   // Fetch the tentChannel from the database
//   const tentChannel = await db.tent_settings.findFirst({
//     where: {
//       channelId,
//     },
//   });
//
//   if (!tentChannel) {
//     throw new Error(`TentChannel with ID ${channelId} not found`);
//   }
//
//   // Fetch the new host from the database
//   const newHost = await db.users.findUnique({
//     where: {
//       discord_id: newHostId,
//     },
//   });
//
//   if (!newHost) {
//     throw new Error(`User with Discord ID ${newHostId} not found`);
//   }
//
//   // Update the hostId in the tentChannel data
//   return db.tent_settings.update({
//     where: {
//       id: tentChannel.id,
//     },
//     data: {
//       hostId: newHost.id,
//     },
//   });
// }

// async function tentAdd(
//   voiceChannel: VoiceBasedChannel,
//   target: GuildMember,
// ):Promise<EmbedBuilder> {
//   let verb = '';
//
//   if (voiceChannel.permissionsFor(target).has(PermissionsBitField.Flags.ViewChannel) === false){
//     return embedTemplate()
//       .setTitle('Error')
//       .setColor(Colors.Red)
//       .setDescription(`${target} is banned from ${voiceChannel}, unban them first!`);
//   }
//
//   if (!voiceChannel.permissionsFor(target).has(PermissionsBitField.Flags.ViewChannel) === true){
//     voiceChannel.permissionOverwrites.create(target, { ViewChannel: true, Connect: true });
//     verb = 'added';
//   } else {
//     voiceChannel.permissionOverwrites.delete(target);
//     verb = 'un-added';
//   }
//   // log.debug(F, `${target.displayName} is now ${verb}`);
//
//   return embedTemplate()
//     .setTitle('Success')
//     .setColor(Colors.Green)
//     .setDescription(`${target} has been ${verb} from ${voiceChannel}`);
// }
