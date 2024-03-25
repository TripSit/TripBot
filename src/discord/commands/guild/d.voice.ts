/* eslint-disable sonarjs/no-small-switch */
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  // Guild,
  Colors,
  SlashCommandBuilder,
  GuildMember,
  PermissionsBitField,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  VoiceBasedChannel,
  TextChannel,
  Message,
  VoiceState,
  ChannelType,
  CategoryChannel,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  ButtonInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
  ButtonBuilder,
  ButtonStyle,
  UserSelectMenuBuilder,
  InteractionEditReplyOptions,
  ActionRowBuilder,
  Role,
  time,
} from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import Bottleneck from 'bottleneck';
import { stripIndents } from 'common-tags';
import { DateTime, Duration } from 'luxon';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';

const F = f(__filename);
const limiter = new Bottleneck({
  minTime: 1000, // Minimum time between requests
  reservoir: 5, // Initial number of available requests
  reservoirRefreshAmount: 5, // Number of requests added each interval
  reservoirRefreshInterval: 5000, // Interval between adding new requests
});

/* TODO
* Make sure you can't whitelist AND blacklist someone

*/

// Command that makes the bot ping the Join VC role
let lastTentPingTime = DateTime.now().minus({ hours: 1 }); // Initialize the last ping time to 1 hour ago
const userTentPingTimes: { [userId: string]: DateTime } = {}; // Initialize an empty object to store user ping times
namespace text {
  export function guildOnly() {
    return 'This must be performed in a guild!';
  }

  export function memberOnly() {
    return 'This must be performed by a member of a guild!';
  }

  export function globalCoolDown() {
    return env.NODE_ENV === 'production'
      ? { hours: 1 }
      : { seconds: 1 };
  }

  export function userCoolDown() {
    return env.NODE_ENV === 'production'
      ? { hours: 3 }
      : { seconds: 3 };
  }
}

namespace util {
  export async function getCommandID(commandName: string, clientId: string, guildId: string): Promise<string | null> {
    const rest = new REST({ version: '9' }).setToken(env.DISCORD_CLIENT_TOKEN);

    // Fetch all commands for your client in the guild
    const commands = await rest.get(
      Routes.applicationGuildCommands(clientId, guildId),
    ) as { name: string; id: string }[];

    // Find the command with the specified name
    const command = commands.find(cmd => cmd.name === commandName);

    // Return the command's ID, or null if the command was not found
    return command ? command.id : null;
  }

  // TODO: Edit this function down so that it calls upon the split functions such as updateJoinLevel and updateTentMode
  export async function updateTentPermissions(voiceChannel: VoiceBasedChannel): Promise<void> {
    log.debug(F, `Updating permissions for ${voiceChannel.name}`);
    // Get the tent data
    const tentData = await db.tent_settings.findFirst({
      where: {
        channel_id: voiceChannel.id,
      },
    });

    if (!tentData) {
      return;
    }

    // Update everyone roles based on the tent mode
    if (tentData.mode === 'PRIVATE') {
      await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { ViewChannel: false, Connect: false });
    } else {
      await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { ViewChannel: true, Connect: true });
    }

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
      await Promise.all(tentBanList.map(async ban => {
        if (ban.user.discord_id) {
          await voiceChannel.permissionOverwrites.edit(ban.user.discord_id, { ViewChannel: false, Connect: false });
          log.debug(F, `Banned user ${ban.user.discord_id} from ${voiceChannel.name}`);
        }
      }));
    }

    // Get the whitelist
    const tentWhiteList = await db.tent_whitelist.findMany({
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

    await Promise.all(tentWhiteList.map(async whitelist => {
      if (whitelist.user.discord_id) {
        await voiceChannel.permissionOverwrites.edit(whitelist.user.discord_id, { ViewChannel: true, Connect: true });
        log.debug(F, `Whitelisted user ${whitelist.user.discord_id} for ${voiceChannel.name}`);
      }
    }));

    // Clear user overwrites that are not in the whitelist or blacklist
    await Promise.all(voiceChannel.permissionOverwrites.cache.map(async overwrite => {
      if (overwrite.type === 1) {
        if (!tentWhiteList.find(whitelist => whitelist.user.discord_id === overwrite.id)
          && !tentBanList.find(ban => ban.user.discord_id === overwrite.id)) {
          await voiceChannel.permissionOverwrites.delete(overwrite.id);
          log.debug(F, `Cleared permission overwrite for ${overwrite.id}`);
        }
      }
    }));

    const tentJoinLevel = tentData.join_level;

    const vipRoles = {
      0: env.ROLE_VIP_0,
      10: env.ROLE_VIP_10,
      20: env.ROLE_VIP_20,
      30: env.ROLE_VIP_30,
      40: env.ROLE_VIP_40,
      50: env.ROLE_VIP_50,
      60: env.ROLE_VIP_60,
      70: env.ROLE_VIP_70,
      80: env.ROLE_VIP_80,
      90: env.ROLE_VIP_90,
      100: env.ROLE_VIP_100,
    };

    await Promise.all(Object.entries(vipRoles).map(async ([roleNumber, roleId]) => {
      // Convert roleNumber from string to number
      const number = parseInt(roleNumber, 10);
      log.debug(F, `Role number: ${number}`);

      // If the tent is set to private, deny all roles
      if (tentData.mode === 'PRIVATE') {
        await voiceChannel.permissionOverwrites.edit(roleId, { ViewChannel: false, Connect: false });
        log.debug(F, `Set permissions for role ${roleId} in ${voiceChannel.name}`);
      } else {
      // Check if the tentData.join_level is equal or more than the number in the role name
        if (tentData.join_level <= number) {
          await voiceChannel.permissionOverwrites.edit(roleId, { ViewChannel: true, Connect: true });
          log.debug(F, `Set permissions for role ${roleId} in ${voiceChannel.name}`);
        }
        // Check if the tentData.join_level is less than the number in the role name
        if (tentData.join_level > number) {
          await voiceChannel.permissionOverwrites.edit(roleId, { ViewChannel: false, Connect: false });
          log.debug(F, `Set permissions for role ${roleId} in ${voiceChannel.name}`);
        }
      }
    }));
  }

  export async function updateJoinLevel(
    interaction: ChatInputCommandInteraction | StringSelectMenuInteraction,
  ): Promise<EmbedBuilder> {
    const voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceBasedChannel;
    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: voiceChannel.id,
      },
    });

    const newLevel = tentData.join_level;

    const vipRoles = {
      0: env.ROLE_VIP_0,
      10: env.ROLE_VIP_10,
      20: env.ROLE_VIP_20,
      30: env.ROLE_VIP_30,
      40: env.ROLE_VIP_40,
      50: env.ROLE_VIP_50,
      60: env.ROLE_VIP_60,
      70: env.ROLE_VIP_70,
      80: env.ROLE_VIP_80,
      90: env.ROLE_VIP_90,
      100: env.ROLE_VIP_100,
    };

    // Check the current channel permissions against the new join level
    await Promise.all(Object.entries(vipRoles).map(async ([roleNumber, roleId]) => {
      // Convert roleNumber from string to number
      const number = parseInt(roleNumber, 10);

      // Determine the desired permissions
      let desiredPermissions: { ViewChannel: boolean | null, Connect: boolean | null } | undefined;
      if (newLevel > number) {
        desiredPermissions = { ViewChannel: false, Connect: false };
      } else if (newLevel <= number) {
        desiredPermissions = { ViewChannel: null, Connect: null };
      }

      // Define the type for permissions
      type Permissions = {
        [key: string]: boolean | undefined;
      };

      // Get the current permissions
      const overwrite = voiceChannel.permissionOverwrites.cache.get(roleId);
      const allowedPermissions: Permissions = overwrite ? overwrite.allow.serialize() : {};
      const deniedPermissions: Permissions = overwrite ? overwrite.deny.serialize() : {};

      const viewChannelPermission = allowedPermissions.ViewChannel === true ? true : (deniedPermissions.ViewChannel === true ? false : null);
      const connectPermission = allowedPermissions.Connect === true ? true : (deniedPermissions.Connect === true ? false : null);

      // If the current permissions are different from the desired permissions, edit the permissions
      log.debug(F, `ViewChannel: ${viewChannelPermission}, Connect: ${connectPermission}`);
      if (desiredPermissions && (viewChannelPermission !== desiredPermissions.ViewChannel || connectPermission !== desiredPermissions.Connect)) {
        await voiceChannel.permissionOverwrites.edit(roleId, desiredPermissions);
        log.debug(F, `Set permissions for role ${roleId} in ${voiceChannel.name}`);
      }
    }));

    // Return an embed message indicating that the join level has been updated
    return new EmbedBuilder()
      .setTitle('Join Level Updated')
      .setDescription(`The join level has been updated to ${newLevel}.`);
  }

  export async function updateTentMode(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
  ): Promise<EmbedBuilder> {
    const voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceBasedChannel;
    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: voiceChannel.id,
      },
    });

    const newMode = tentData.mode;
    log.debug(F, `New mode: ${newMode}`);

    // Update the everyone role based on the new mode
    if (newMode === 'PRIVATE') {
      await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { ViewChannel: false, Connect: false });
    } else {
      await voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { ViewChannel: true, Connect: true });
    }

    return new EmbedBuilder()
      .setTitle('Tent Mode Updated')
      .setDescription(`The tent mode has been updated to ${newMode}.`);
  }

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
          name: userData.defaultTentName || `${newState.member.displayName}'s tent`,
          created_by: userData.id,
          mode: userData.defaultTentMode || 'PUBLIC',
          updated_by: userData.id,
          join_level: userData.joinTentLevel,
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
      {
        id: env.ROLE_VIP_0 as string,
        deny: [
          ...(tentData.join_level > 0 ? [PermissionsBitField.Flags.ViewChannel] : []),
          ...(tentData.join_level > 0 ? [PermissionsBitField.Flags.Connect] : []),
        ],
      },
      {
        id: env.ROLE_VIP_10 as string,
        deny: [
          ...(tentData.join_level > 10 ? [PermissionsBitField.Flags.ViewChannel] : []),
          ...(tentData.join_level > 10 ? [PermissionsBitField.Flags.Connect] : []),
        ],
      },
      {
        id: env.ROLE_VIP_20 as string,
        deny: [
          ...(tentData.join_level > 20 ? [PermissionsBitField.Flags.ViewChannel] : []),
          ...(tentData.join_level > 20 ? [PermissionsBitField.Flags.Connect] : []),
        ],
      },
      {
        id: env.ROLE_VIP_30 as string,
        deny: [
          ...(tentData.join_level > 30 ? [PermissionsBitField.Flags.ViewChannel] : []),
          ...(tentData.join_level > 30 ? [PermissionsBitField.Flags.Connect] : []),
        ],
      },
      {
        id: env.ROLE_VIP_40 as string,
        deny: [
          ...(tentData.join_level > 40 ? [PermissionsBitField.Flags.ViewChannel] : []),
          ...(tentData.join_level > 40 ? [PermissionsBitField.Flags.Connect] : []),
        ],
      },
      {
        id: env.ROLE_VIP_50 as string,
        deny: [
          ...(tentData.join_level > 50 ? [PermissionsBitField.Flags.ViewChannel] : []),
          ...(tentData.join_level > 50 ? [PermissionsBitField.Flags.Connect] : []),
        ],
      },
      {
        id: env.ROLE_VIP_60 as string,
        deny: [
          ...(tentData.join_level > 60 ? [PermissionsBitField.Flags.ViewChannel] : []),
          ...(tentData.join_level > 60 ? [PermissionsBitField.Flags.Connect] : []),
        ],
      },
      {
        id: env.ROLE_VIP_70 as string,
        deny: [
          ...(tentData.join_level > 70 ? [PermissionsBitField.Flags.ViewChannel] : []),
          ...(tentData.join_level > 70 ? [PermissionsBitField.Flags.Connect] : []),
        ],
      },
      {
        id: env.ROLE_VIP_80 as string,
        deny: [
          ...(tentData.join_level > 80 ? [PermissionsBitField.Flags.ViewChannel] : []),
          ...(tentData.join_level > 80 ? [PermissionsBitField.Flags.Connect] : []),
        ],
      },
      {
        id: env.ROLE_VIP_90 as string,
        deny: [
          ...(tentData.join_level > 90 ? [PermissionsBitField.Flags.ViewChannel] : []),
          ...(tentData.join_level > 90 ? [PermissionsBitField.Flags.Connect] : []),
        ],
      },
      {
        id: env.ROLE_VIP_100 as string,
        deny: [
          ...(tentData.join_level > 100 ? [PermissionsBitField.Flags.ViewChannel] : []),
          ...(tentData.join_level > 100 ? [PermissionsBitField.Flags.Connect] : []),
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
    const tentWhiteList = await db.tent_whitelist.findMany({
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
      name: await util.tentName(tentData.name),
      type: ChannelType.GuildVoice,
      parent: env.CATEGORY_VOICE,
      permissionOverwrites: [
        ...permissionOverwrites,
      ],
    });

    await newState.member.voice.setChannel(newChannel.id);

    // Get the command ID for /voice settings
    const commandID = await util.getCommandID('voice', env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID);
    log.debug(F, `Command ID: ${commandID}`);
    await newChannel.fetch();

    const infoMessage = await newChannel.send(stripIndents`## Welcome to your tent, <@${newState.member?.id}>
      
      ## **Current Tent Settings**
        - **Creator:** <@${newState.member.id}>
        - **Host:** <@${newState.member.id}>
        - **Visibility:** ${tentData.mode.charAt(0).toUpperCase() + tentData.mode.slice(1).toLowerCase()}
        - **Join Level:** ${tentData.join_level === 0 ? 'Any' : `${tentData.join_level}`}
      
      ## **Use </voice settings:${commandID}> to control your tent and view ban/whitelist or use the commands below**
       - \`/voice rename\` - Choose a new name for your tent
       - \`/voice ping\` - Use this to ping those opted-in to VC ping invites
       - \`/voice private\` - Switch your tent to private/public mode
       - \`/voice ban\` - Bans a user from joining and seeing your tents
       - \`/voice whitelist\` - Allows a user to always be able to join your tent
       - \`/voice cohost\` - Allows a trusted user to use these commands on your behalf
      ***NOTE: Changes are saved, and persist next time you make a tent***`);
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

  export async function voiceMenu(
    interaction: ChatInputCommandInteraction | ButtonInteraction | UserSelectMenuInteraction | StringSelectMenuInteraction,
  ):Promise<ActionRowBuilder<ButtonBuilder | UserSelectMenuBuilder | StringSelectMenuBuilder>[]> {
    const member = interaction.member as GuildMember;
    const userData = await db.users.upsert({
      where: { discord_id: member.id },
      create: { discord_id: member.id },
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
          name: member.displayName,
          created_by: userData.id,
          mode: 'PUBLIC',
          updated_by: userData.id,
        },
      });
    }
    // log.debug(F, `TentData: ${JSON.stringify(tentData, null, 2)}`);

    const navButtons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(button.rename());

    if (tentData.mode === 'PUBLIC') {
      navButtons.addComponents(button.lock());
    } else {
      navButtons.addComponents(button.unlock());
    }

    const isAfterUserCoolDown = await validate.pingAfterUserCoolDown(member.id);
    // log.debug(F, `isAfterUserCoolDown: ${isAfterUserCoolDown}`);
    const isAfterGlobalCoolDown = await validate.pingAfterGlobalCoolDown();
    // log.debug(F, `isAfterGlobalCoolDown: ${isAfterGlobalCoolDown}`);

    // Check if the user used the command less than the user cool down
    if (isAfterUserCoolDown && isAfterGlobalCoolDown && tentData.mode === 'PUBLIC') {
      navButtons.addComponents(button.ping());
      // log.debug(F, 'Ping button added');
    } else {
      navButtons.addComponents(button.ping().setDisabled(true));
      // log.debug(F, 'Ping button disabled');
    }

    return [
      navButtons,
      new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
          await select.joinLevel(userData.id),
        ),
      new ActionRowBuilder<UserSelectMenuBuilder>()
        .addComponents(
          await select.hostlist(userData.id),
        ),
      new ActionRowBuilder<UserSelectMenuBuilder>()
        .addComponents(
          await select.whitelist(userData.id),
        ),
      new ActionRowBuilder<UserSelectMenuBuilder>()
        .addComponents(
          await select.blacklist(userData.id),
        ),
    ];
  }

  export async function pingJoinVc(
    interaction: ChatInputCommandInteraction | ButtonInteraction,
  ) {
    const channelLounge = await (interaction.member as GuildMember).guild.channels
      .fetch(env.CHANNEL_LOUNGE) as TextChannel;
    const channelVoice = (interaction.member as GuildMember).voice.channel as VoiceBasedChannel;
    const member = interaction.member as GuildMember;
    const role = await channelLounge.guild.roles.fetch(env.ROLE_JOINVC) as Role;

    // Send the ping
    await channelLounge.send(`<@${member.id}> wants you to <@&${role.id}> in <#${channelVoice.id}>!`);
    log.debug(F, `Pinged the Join VC role in <#${channelVoice.id}>`);

    // Update the last usage times
    lastTentPingTime = DateTime.now();
    userTentPingTimes[member.id] = DateTime.now();
    log.debug(F, `Set global ping time to ${lastTentPingTime}`);
    log.debug(F, `Set user ping time to   ${userTentPingTimes[member.id]}`);
    log.debug(F, `Now is                  ${DateTime.now()}`);
  }
}

namespace page {
  export async function start(
    interaction: ChatInputCommandInteraction | ButtonInteraction
    | UserSelectMenuInteraction | StringSelectMenuInteraction,
  ): Promise<InteractionEditReplyOptions> {
    // log.info(F, await commandContext(interaction));
    if (!interaction.guild || !interaction.member) return { content: text.guildOnly() };
    const member = interaction.member as GuildMember;
    // Fetch the user's data from the database
    const userData = await db.users.upsert({
      where: { discord_id: member.id },
      create: { discord_id: member.id },
      update: {},
    });

    let description = '';

    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        created_by: userData.id,
      },
    });
    // log.debug(F, `TentData: ${JSON.stringify(tentData, null, 2)}`);

    const channelStr = tentData.channel_id
      ? `**Name:** ${tentData.name}`
      : `No tent created, join <#${env.CHANNEL_CAMPFIRE}> to make one!`;

    description += `${channelStr}`;

    description += `\n**Visibility:** ${tentData.mode.charAt(0).toUpperCase() + tentData.mode.slice(1).toLowerCase()}`;

    const tentHostList = await db.tent_hostlist.findMany({
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

    // Ping to join VC timeout
    // Check if the last time the user used the command is less than the global last used time
    const userLastPinged = userTentPingTimes[member.id] ?? DateTime.now().minus(text.userCoolDown());
    const globalLastPinged = lastTentPingTime;
    const nextPingTime = DateTime.now().diff(userLastPinged) < Duration.fromObject(text.userCoolDown())
      ? userLastPinged.plus(text.userCoolDown())
      : globalLastPinged.plus(text.globalCoolDown());
    // Check if the next ping time is in the future or past
    let pingTime = nextPingTime.diffNow() > Duration.fromObject({ seconds: 0 })
      ? `Available ${time(nextPingTime.toJSDate(), 'R')}`
      : 'Available';
    // Check if the tent is public, if not, disable the ping button
    if (tentData.mode === 'PRIVATE') {
      pingTime = 'Unavailable while private';
    }
    description += `\n${pingTime}\n`;

    // log.debug(F, `tentHostList: ${JSON.stringify(tentHostList, null, 2)}`);
    const hostListStr = tentHostList.map(host => `<@${host.user.discord_id}>`).join(', ');
    if (tentHostList.length > 0) {
      description += `\n**Host List:** ${hostListStr}`;
    } else {
      description += '\n**Host List:** None';
    }

    const tentWhiteList = await db.tent_whitelist.findMany({
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
    // log.debug(F, `TentWhiteList: ${JSON.stringify(tentWhiteList, null, 2)}`);

    // Show embed with ban list
    const whiteListStr = tentWhiteList.map(whitelist => `<@${whitelist.user.discord_id}>`).join(', ');
    if (tentWhiteList.length > 0) {
      description += `\n**White List:** ${whiteListStr}`;
    } else {
      description += '\n**White List:** None';
    }

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
    // log.debug(F, `TentBanList: ${JSON.stringify(tentBanList, null, 2)}`);
    const banListStr = tentBanList.map(ban => `<@${ban.user.discord_id}>`).join(', ');
    if (tentBanList.length > 0) {
      description += `\n**Ban List:** ${banListStr}`;
    } else {
      description += '\n**Ban List:** None';
    }
    // log.debug(F, `Description: ${description}`);
    const isAfterUserCoolDown = await validate.pingAfterUserCoolDown(member.id);
    // log.debug(F, `isAfterUserCoolDown: ${isAfterUserCoolDown}`);
    const isAfterGlobalCoolDown = await validate.pingAfterGlobalCoolDown();
    // log.debug(F, `isAfterGlobalCoolDown: ${isAfterGlobalCoolDown}`);

    return {
      embeds: [
        new EmbedBuilder()
          .setTitle('⛺ Tent Settings')
          .setColor(Colors.Orange)
          // .setDescription(description)
          .addFields({ name: `🏷️ Tent Name: ${tentData.name}`, value: '*Name that is applied every time you make a tent*' })
          .addFields({
            name: `${tentData.mode === 'PRIVATE' ? '🔒' : '🔓'} Visibility: ${tentData.mode.charAt(0).toUpperCase() + tentData.mode.slice(1).toLowerCase()}`,
            value: `${tentData.mode === 'PRIVATE' ? '*Only those on your whitelist can join*' : '*Anyone can join, unless on your ban list*'}`,
          })
          .addFields({
            name: `${isAfterUserCoolDown && isAfterGlobalCoolDown && tentData.mode === 'PUBLIC' ? '🔔' : '🔕'} Ping Join VC: ${pingTime}`,
            value: '*Notifies those opted-in to consider joining*',
          })
          .addFields({
            name: `⭐ Join Level: ${tentData.join_level === 0 ? 'Any' : `${tentData.join_level}`} ${tentData.mode === 'PRIVATE' ? '(Irrelevant while private)' : ''}`,
            value: '*Minimum level required to join your tent*',
          })
          .addFields({ name: '👔 Host List', value: `${hostListStr}\n*Can change your tent settings on your behalf*` })
          .addFields({ name: '⚪ White List', value: `${whiteListStr}\n*Can always join, even if the tent is private*` })
          .addFields({ name: '⚫ Ban List', value: `${banListStr}\n*Cannot join, nor see your tent in their channel list*` }),
      ],
      components: await util.voiceMenu(interaction),
    };
  }
}

namespace cmd {
  export async function tentRename(
    interaction:ChatInputCommandInteraction | ButtonInteraction,
  ):Promise<EmbedBuilder> {
  // Check if the interaction was a button interaction
    let newName = '';
    const voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceBasedChannel;
    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: voiceChannel.id,
      },
    });
    if (interaction instanceof ButtonInteraction) {
    // If so, open a modal to collect the new name
      log.debug(F, 'Button interaction detected');
      const modal = new ModalBuilder()
        .setCustomId(`tentRenameModal~${interaction.id}`)
        .setTitle('Rename your tent')
        .addComponents(new ActionRowBuilder<TextInputBuilder>()
          .addComponents(new TextInputBuilder()
            .setLabel('Choose a new name for your tent')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`${await util.tentName(tentData.name)}`)
            .setMaxLength(1000)
            .setCustomId('modalTentName')));

      // Send the modal
      await interaction.showModal(modal);

      // Get the new name from the modal
      const filter = (i:ModalSubmitInteraction) => i.customId === `tentRenameModal~${interaction.id}`;
      await interaction.awaitModalSubmit({ filter, time: 60000 })
        .then(async i => {
          // Get the new name from the modal
          await i.deferUpdate();
          newName = i.fields.getTextInputValue('modalTentName') as string;
          log.debug(F, `New name: ${newName}`);
        });
    } else if (interaction instanceof ChatInputCommandInteraction) {
      newName = interaction.options.getString('name') as string;
    }

    const ogName = voiceChannel.name;
    const actor = interaction.member as GuildMember;

    const userData = await db.users.upsert({
      where: { discord_id: actor.id },
      create: { discord_id: actor.id, defaultTentName: newName },
      update: { defaultTentName: newName },
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

    log.debug(F, `${ogName} has been named to ${newName}`);

    return embedTemplate()
      .setTitle('Success')
      .setColor(Colors.Green)
      .setDescription(`${ogName} has been renamed to ${voiceChannel.name}`);
  }

  export async function tentPrivate(
    interaction:ChatInputCommandInteraction | ButtonInteraction,
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

    // log.debug(F, `TentData: ${JSON.stringify(tentData, null, 2)}`);

    if (tentData.mode === 'PUBLIC') {
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

      // Update the user's defaultTentMode
      await db.users.upsert({
        where: { discord_id: interaction.user.id },
        create: { discord_id: interaction.user.id, defaultTentMode: 'PRIVATE' },
        update: { defaultTentMode: 'PRIVATE' },
      });
    } else {
      // verb = 'unhidden (and unlocked)';
      mode = 'public';
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

      // Update the user's defaultTentMode
      await db.users.upsert({
        where: { discord_id: interaction.user.id },
        create: { discord_id: interaction.user.id, defaultTentMode: 'PUBLIC' },
        update: { defaultTentMode: 'PUBLIC' },
      });
    }

    // Run the updateTentMode function
    await util.updateTentMode(interaction);

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
          .replace(/\*\*Visibility:\*\* .*/, `**Visibility:** ${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
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

    const tentWhiteData = await db.tent_whitelist.findFirst({
      where: {
        tent_id: tentChannel.id,
        user_id: targetData.id,
      },
    });

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

      // If the user is on the whitelist, remove them
      if (tentWhiteData) {
        await db.tent_whitelist.delete({
          where: {
            tent_id_user_id: {
              tent_id: tentChannel.id,
              user_id: targetData.id,
            },
          },
        });
      }
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

    const tentBanData = await db.tent_blacklist.findFirst({
      where: {
        tent_id: tentData.id,
        user_id: targetData.id,
      },
    });

    const tentWhiteData = await db.tent_whitelist.findFirst({
      where: {
        tent_id: tentData.id,
        user_id: targetData.id,
      },
    });

    let verb = '';
    if (tentWhiteData) {
      // If the target user is already whitelisted, remove them from the whitelist
      await voiceChannel.permissionOverwrites.delete(target);
      verb = 'removed from your whitelist';

      await db.tent_whitelist.delete({
        where: {
          tent_id_user_id: {
            tent_id: tentData.id,
            user_id: targetData.id,
          },
        },
      });
    } else {
      // If not, add the target user to the whitelist
      await voiceChannel.permissionOverwrites.edit(target, { ViewChannel: true, Connect: true });
      verb = 'added to your whitelist';

      await db.tent_whitelist.create({
        data: {
          tent_id: tentData.id,
          user_id: targetData.id,
        },
      });

      // If the user is on the ban list, remove them
      if (tentBanData) {
        await db.tent_blacklist.delete({
          where: {
            tent_id_user_id: {
              tent_id: tentData.id,
              user_id: targetData.id,
            },
          },
        });
      }
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
    // log.debug(F, `TentData: ${JSON.stringify(tentData, null, 2)}`);

    // Fetch the target data from the database
    const target = interaction.options.getMember('target') as GuildMember;
    const targetData = await db.users.upsert({
      where: { discord_id: target.id },
      create: { discord_id: target.id },
      update: {},
    });
    // log.debug(F, `TargetData: ${JSON.stringify(targetData, null, 2)}`);

    const tentHostData = await db.tent_hostlist.findFirst({
      where: {
        tent_id: tentData.id,
        user_id: targetData.id,
      },
    });
    // log.debug(F, `TentHostData: ${JSON.stringify(tentHostData, null, 2)}`);

    let verb = '';
    if (tentHostData) {
      await voiceChannel.permissionOverwrites.edit(target, { MoveMembers: false });
      verb = 'removed as a co-host';

      await db.tent_hostlist.delete({
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

      await db.tent_hostlist.create({
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
    interaction:ChatInputCommandInteraction | ButtonInteraction,
  ): Promise<EmbedBuilder> {
    const member = interaction.member as GuildMember;
    const voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceBasedChannel;
    const role = await voiceChannel.guild.roles.fetch(env.ROLE_JOINVC);
    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: voiceChannel.id,
      },
    });
    if (role) {
      // Check if the user used the command less than the user cool down

      if (!(await validate.pingAfterUserCoolDown(member.id))) {
        return embedTemplate()
          .setTitle('Cool Down')
          .setColor(Colors.Red)
          .setDescription(stripIndents`
            You already used this command <t:${userTentPingTimes[member.id].toJSDate()}:R>. 
            You can use it again <t:${userTentPingTimes[member.id].plus(text.userCoolDown())}:R>.
          `);
      }

      // Check if the command was used less than the global cool down
      if (!(await validate.pingAfterGlobalCoolDown())) {
        return embedTemplate()
          .setTitle('Cool Down')
          .setColor(Colors.Red)
          .setDescription(stripIndents`
            Someone else used this command <t:${lastTentPingTime.toJSDate()}:R>.
            You can use it again <t:${lastTentPingTime.plus(text.globalCoolDown())}:R>.
          `);
      }

      // Check that the tent is public
      if (tentData.mode === 'PRIVATE') {
        return embedTemplate()
          .setTitle('Error')
          .setColor(Colors.Red)
          .setDescription(stripIndents`
            You can't ping the Join VC role from a private tent.
            Change the tent mode to public to use this command.
          `);
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

      await util.pingJoinVc(interaction);

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

  export async function tentJoinLevel(
    interaction:ChatInputCommandInteraction,
  ): Promise<EmbedBuilder> {
    const voiceChannel = (interaction.member as GuildMember).voice.channel as VoiceBasedChannel;
    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: voiceChannel.id,
      },
    });

    const level = interaction.options.getInteger('level') as number;

    await db.tent_settings.update({
      where: {
        id: tentData.id,
      },
      data: {
        join_level: level,
      },
    });

    const actor = interaction.member as GuildMember;

    // Also update joinTentLevel in the users saved settings
    await db.users.upsert({
      where: { discord_id: actor.id },
      create: { discord_id: actor.id },
      update: { joinTentLevel: level },
    });

    // Run the updateJoinLevel function
    await util.updateJoinLevel(interaction);

    // Edit the info message with the new join level
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
          .replace(/\*\*Join Level:\*\* .*/, `**Join Level:** ${tentData.join_level === 0 ? 'Any' : `${tentData.join_level}`}`);
        infoMessage.edit(newContent);
      }
    }

    return embedTemplate()
      .setTitle('Success')
      .setColor(Colors.Green)
      .setDescription(`The join level has been set to ${level}`);
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
    const member = interaction.member as GuildMember;

    const userData = await db.users.upsert({
      where: { discord_id: member.id },
      create: { discord_id: member.id },
      update: {},
    });

    const tentChannel = await db.tent_settings.findFirst({
      where: {
        channel_id: voiceChannel.id,
        created_by: userData.id,
      },
    });

    if (!tentChannel) {
      // If they're not the owner, check if they're in the host list
      const hostChannel = await db.tent_settings.findFirst({
        where: {
          channel_id: voiceChannel.id,
          hostlist: {
            some: {
              user_id: userData.id,
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
    const target = interaction.options.getMember('target') as GuildMember ?? interaction.member;

    if (target.roles.cache.has(env.ROLE_MODERATOR)) {
      await interaction.reply({ content: 'You cannot do that to a moderator!', ephemeral: true });
      return true;
    }
    return false;
  }

  export async function pingAfterUserCoolDown(userId: string):Promise<boolean> {
    const userLastPinged = userTentPingTimes[userId] ?? DateTime.now().minus({ hours: 1 });
    // log.debug(F, `UserLastPinged: ${userLastPinged}`);
    const coolDownTime = userLastPinged.plus(text.userCoolDown());
    // log.debug(F, `CoolDownTime  : ${coolDownTime}`);
    // log.debug(F, `Now           : ${DateTime.now()}`);
    return (DateTime.now() > coolDownTime);
  }

  export async function pingAfterGlobalCoolDown():Promise<boolean> {
    const globalLastPinged = lastTentPingTime;
    // log.debug(F, `GlobalLastPinged: ${globalLastPinged}`);
    const coolDownTime = globalLastPinged.plus(text.globalCoolDown());
    // log.debug(F, `CoolDownTime    : ${coolDownTime}`);
    // log.debug(F, `Now             : ${DateTime.now()}`);
    return (DateTime.now() > coolDownTime);
  }
}

namespace button {
  export function lock() {
    return new ButtonBuilder()
      .setCustomId('voice~lock')
      .setLabel('Lock Tent')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Primary);
  }

  export function unlock() {
    return new ButtonBuilder()
      .setCustomId('voice~unlock')
      .setLabel('Unlock Tent')
      .setEmoji('🔓')
      .setStyle(ButtonStyle.Primary);
  }

  export function rename() {
    return new ButtonBuilder()
      .setCustomId('voice~rename')
      .setLabel('Rename Tent')
      .setEmoji('🏷️')
      .setStyle(ButtonStyle.Primary);
  }

  export function ping() {
    return new ButtonBuilder()
      .setCustomId('voice~ping')
      .setLabel('Ping Join VC')
      .setEmoji('🔔')
      .setStyle(ButtonStyle.Primary);
  }
}

namespace select {
  export async function blacklist(
    userId: string,
  ) {
    const ticketData = await db.tent_settings.findFirstOrThrow({
      where: {
        created_by: userId,
      },
    });

    const listData = await db.tent_blacklist.findMany({
      where: {
        tent_id: ticketData.id,
      },
      select: {
        user: {
          select: {
            discord_id: true,
          },
        },
      },
    });

    // Get a list of discord IDs and filter out the null values
    const discordIds = listData
      .map(entry => entry.user.discord_id)
      .filter(entry => entry !== null) as string[];

    return new UserSelectMenuBuilder()
      .setCustomId('voice~blacklist')
      .setPlaceholder('Blacklist Users')
      .setDefaultUsers(discordIds)
      .setMinValues(0)
      .setMaxValues(25);
  }

  export async function whitelist(
    userId: string,
  ) {
    const ticketData = await db.tent_settings.findFirstOrThrow({
      where: {
        created_by: userId,
      },
    });

    const listData = await db.tent_whitelist.findMany({
      where: {
        tent_id: ticketData.id,
      },
      select: {
        user: {
          select: {
            discord_id: true,
          },
        },
      },
    });

    // Get a list of discord IDs and filter out the null values
    const discordIds = listData
      .map(entry => entry.user.discord_id)
      .filter(entry => entry !== null) as string[];

    return new UserSelectMenuBuilder()
      .setCustomId('voice~whitelist')
      .setPlaceholder('Whitelist Users')
      .setDefaultUsers(discordIds)
      .setMinValues(0)
      .setMaxValues(25);
  }

  export async function hostlist(
    userId: string,
  ) {
    const ticketData = await db.tent_settings.findFirstOrThrow({
      where: {
        created_by: userId,
      },
    });

    const listData = await db.tent_hostlist.findMany({
      where: {
        tent_id: ticketData.id,
      },
      select: {
        user: {
          select: {
            discord_id: true,
          },
        },
      },
    });

    // Get a list of discord IDs and filter out the null values
    const discordIds = listData
      .map(entry => entry.user.discord_id)
      .filter(entry => entry !== null) as string[];

    return new UserSelectMenuBuilder()
      .setCustomId('voice~hostlist')
      .setPlaceholder('Host List')
      .setDefaultUsers(discordIds)
      .setMinValues(0)
      .setMaxValues(25);
  }

  export async function joinLevel(
    userId: string,
  ) {
    const ticketData = await db.tent_settings.findFirstOrThrow({
      where: {
        created_by: userId,
      },
    });

    return new StringSelectMenuBuilder()
      .setCustomId('voice~joinlevel')
      .setPlaceholder('Join Level')
      .addOptions([
        new StringSelectMenuOptionBuilder()
          .setLabel('Join Level 0 (Any)')
          .setValue('0')
          .setDefault(ticketData.join_level === 0),
        new StringSelectMenuOptionBuilder()
          .setLabel('Join Level 10')
          .setValue('10')
          .setDefault(ticketData.join_level === 10),
        new StringSelectMenuOptionBuilder()
          .setLabel('Join Level 20')
          .setValue('20')
          .setDefault(ticketData.join_level === 20),
        new StringSelectMenuOptionBuilder()
          .setLabel('Join Level 30')
          .setValue('30')
          .setDefault(ticketData.join_level === 30),
        new StringSelectMenuOptionBuilder()
          .setLabel('Join Level 40')
          .setValue('40')
          .setDefault(ticketData.join_level === 40),
        new StringSelectMenuOptionBuilder()
          .setLabel('Join Level 50')
          .setValue('50')
          .setDefault(ticketData.join_level === 50),
        new StringSelectMenuOptionBuilder()
          .setLabel('Join Level 60')
          .setValue('60')
          .setDefault(ticketData.join_level === 60),
        new StringSelectMenuOptionBuilder()
          .setLabel('Join Level 70')
          .setValue('70')
          .setDefault(ticketData.join_level === 70),
        new StringSelectMenuOptionBuilder()
          .setLabel('Join Level 80')
          .setValue('80')
          .setDefault(ticketData.join_level === 80),
        new StringSelectMenuOptionBuilder()
          .setLabel('Join Level 90')
          .setValue('90')
          .setDefault(ticketData.join_level === 90),
        new StringSelectMenuOptionBuilder()
          .setLabel('Join Level 100')
          .setValue('100')
          .setDefault(ticketData.join_level === 100),
      ]);
  }
}

namespace selectAction {
  export async function whiteList(
    interaction: UserSelectMenuInteraction,
  ) {
    if (!interaction.channel) return;
    if (!interaction.guild) return;

    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: interaction.channel.id,
      },
    });

    // Clear out the existing values
    await db.tent_whitelist.deleteMany({
      where: {
        tent_id: tentData.id,
      },
    });

    // Take all the values from the select menu and add them to the database
    log.debug(F, `Values: ${interaction.values}`);
    await Promise.all(interaction.values.map(async value => {
      const userData = await db.users.upsert({
        where: { discord_id: value },
        create: { discord_id: value },
        update: {},
      });

      const tentBanData = await db.tent_blacklist.findFirst({
        where: {
          tent_id: tentData.id,
          user_id: userData.id,
        },
      });

      if (tentBanData) {
        // If the user is on the ban list, remove them
        await db.tent_blacklist.delete({
          where: {
            tent_id_user_id: {
              tent_id: tentData.id,
              user_id: userData.id,
            },
          },
        });
      }

      await db.tent_whitelist.create({
        data: {
          tent_id: tentData.id,
          user_id: userData.id,
        },
      });
    }));
  }

  export async function blackList(
    interaction: UserSelectMenuInteraction,
  ) {
    if (!interaction.channel) return;
    if (!interaction.guild) return;

    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: interaction.channel.id,
      },
    });

    // Clear out the existing values
    await db.tent_blacklist.deleteMany({
      where: {
        tent_id: tentData.id,
      },
    });

    // Take all the values from the select menu and add them to the database
    log.debug(F, `Values: ${interaction.values}`);
    await Promise.all(interaction.values.map(async value => {
      const userData = await db.users.upsert({
        where: { discord_id: value },
        create: { discord_id: value },
        update: {},
      });

      const tentWhiteData = await db.tent_whitelist.findFirst({
        where: {
          tent_id: tentData.id,
          user_id: userData.id,
        },
      });

      if (tentWhiteData) {
        // If the user is on the whitelist, remove them
        await db.tent_whitelist.delete({
          where: {
            tent_id_user_id: {
              tent_id: tentData.id,
              user_id: userData.id,
            },
          },
        });
      }

      await db.tent_blacklist.create({
        data: {
          tent_id: tentData.id,
          user_id: userData.id,
        },
      });
    }));
  }

  export async function hostList(
    interaction: UserSelectMenuInteraction,
  ) {
    if (!interaction.channel) return;
    if (!interaction.guild) return;

    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: interaction.channel.id,
      },
    });

    // Clear out the existing values
    await db.tent_hostlist.deleteMany({
      where: {
        tent_id: tentData.id,
      },
    });

    // Take all the values from the select menu and add them to the database
    log.debug(F, `Values: ${interaction.values}`);
    await Promise.all(interaction.values.map(async value => {
      const userData = await db.users.upsert({
        where: { discord_id: value },
        create: { discord_id: value },
        update: {},
      });

      await db.tent_hostlist.create({
        data: {
          tent_id: tentData.id,
          user_id: userData.id,
        },
      });
    }));
  }

  export async function joinLevel(
    interaction: StringSelectMenuInteraction,
  ) {
    if (!interaction.channel) return;
    if (!interaction.guild) return;

    const tentData = await db.tent_settings.findFirstOrThrow({
      where: {
        channel_id: interaction.channel.id,
      },
    });

    const level = parseInt(interaction.values[0], 10);

    await db.tent_settings.update({
      where: {
        id: tentData.id,
      },
      data: {
        join_level: level,
      },
    });

    // Edit the info message with the new join level
    if (tentData.info_message_id) {
      let infoMessage = null as null | Message;
      try {
        infoMessage = await interaction.channel.messages.fetch(tentData.info_message_id);
      } catch (e) {
        // Message was likely deleted, should we re-send it in chat?
      }
      if (infoMessage) {
        // Update the info message with the new mode using regex
        const newContent = infoMessage.content
          .replace(/\*\*Join Level:\*\* .*/, `**Join Level:** ${level === 0 ? 'Any' : `${level}`}`);
        infoMessage.edit(newContent);
      }
    }
  }
}

export async function voiceSelect(
  interaction: UserSelectMenuInteraction | StringSelectMenuInteraction,
): Promise<void> {
  if (!interaction.guild) return;
  // Used in selectMenu.ts
  const menuId = interaction.customId;
  const voiceChannel = interaction.channel as VoiceBasedChannel;
  const [, menuAction] = menuId.split('~') as [
    null,
    'whitelist' | 'blacklist' | 'hostlist' | 'joinlevel',
  ];
  log.debug(F, `[voiceSelect] menuAction: ${menuAction}`);

  switch (menuAction) {
    case 'whitelist': {
      if (interaction instanceof UserSelectMenuInteraction) {
        await selectAction.whiteList(interaction);
        await interaction.update(await page.start(interaction));
        await util.updateTentPermissions(voiceChannel);
      }
      break;
    }
    case 'blacklist': {
      if (interaction instanceof UserSelectMenuInteraction) {
        await selectAction.blackList(interaction);
        await interaction.update(await page.start(interaction));
        await util.updateTentPermissions(voiceChannel);
      }
      break;
    }
    case 'hostlist': {
      if (interaction instanceof UserSelectMenuInteraction) {
        await selectAction.hostList(interaction);
        await interaction.update(await page.start(interaction));
      }
      break;
    }
    case 'joinlevel': {
      if (interaction instanceof StringSelectMenuInteraction) {
        await selectAction.joinLevel(interaction);
        await interaction.update(await page.start(interaction));
        await util.updateJoinLevel(interaction);
      }
      break;
    }
    default: {
      break;
    }
  }
}

export async function voiceButton(
  interaction: ButtonInteraction,
): Promise<void> {
  // Used in buttonClick.ts
  const buttonID = interaction.customId;
  // log.debug(F, `[tripsitButton] buttonID: ${buttonID}`);
  const [, buttonAction] = buttonID.split('~') as [
    null,
    /* button actions */ 'lock' | 'unlock' | 'rename' | 'ping',
  ];

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (buttonAction) {
    case 'lock':
      log.debug(F, 'Locking tent');
      await cmd.tentPrivate(interaction);
      await interaction.update(await page.start(interaction));
      break;
    case 'unlock':
      log.debug(F, 'Unlocking tent');
      await cmd.tentPrivate(interaction);
      await interaction.update(await page.start(interaction));
      break;
    case 'rename':
      log.debug(F, 'Renaming tent');
      await cmd.tentRename(interaction);
      await interaction.update(await page.start(interaction));
      break;
    case 'ping':
      await cmd.tentPing(interaction);
      await interaction.update(await page.start(interaction));
      // This will refresh the buttons after the cool down period
      setTimeout(async () => {
        await interaction.editReply(await page.start(interaction));
      }, Duration.fromObject(text.userCoolDown()).as('milliseconds'));
      break;
    default:
      break;
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
      .setDescription('Rename your Tent')
      .addStringOption(option => option
        .setName('name')
        .setDescription('The new name for your Tent')
        .setRequired(true))
      .setName('rename'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Hide and lock the Tent')
      .setName('private'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Add a user to your Tent ban list')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to ban/unban')
        .setRequired(true))
      .setName('ban'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Add a user to your Tent whitelist')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to add/remove')
        .setRequired(true))
      .setName('whitelist'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Make another user able to use /voice commands')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to make co-host')
        .setRequired(true))
      .setName('cohost'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Ping the Join VC role')
      .setName('ping'))
    .addSubcommand(subcommand => subcommand
      .setDescription('View and change your Tent settings')
      .setName('settings'))
    .addSubcommand(subcommand => subcommand
      .setDescription('Set the minimum level required to join and see your Tent')
      // Options from 0 to 100, in increments of 10
      .addIntegerOption(option => option
        .setName('level')
        .setDescription('The minimum level required to join and see your Tent')
        .setRequired(true)
        .addChoices(
          { name: '0 (Any)', value: 0 },
          { name: '10', value: 10 },
          { name: '20', value: 20 },
          { name: '30', value: 30 },
          { name: '40', value: 40 },
          { name: '50', value: 50 },
          { name: '60', value: 60 },
          { name: '70', value: 70 },
          { name: '80', value: 80 },
          { name: '90', value: 90 },
          { name: '100', value: 100 },
        ))
      .setName('joinlevel')),

  async execute(interaction) {
    if (!(await validate.inGuild(interaction))) return false;
    if (!(await validate.inVoiceChannel(interaction))) return false;
    if (!(await validate.isTentOwnerOrHost(interaction))) return false;
    if (await validate.actingOnSelf(interaction)) return false;

    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });

    const command = interaction.options.getSubcommand() as
      'private' | 'ban' | 'whitelist' | 'rename' | 'cohost' | 'ping' | 'settings' | 'joinlevel';

    switch (command) {
      case 'rename':
        await interaction.editReply({ embeds: [await cmd.tentRename(interaction)] });
        return true;
      case 'private':
        await interaction.editReply({ embeds: [await cmd.tentPrivate(interaction)] });
        return true;
      case 'ban': {
        if (await validate.actingOnMod(interaction)) return false;
        await interaction.editReply({ embeds: [await cmd.tentBan(interaction)] });
        return true;
      }
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
        await interaction.editReply(await page.start(interaction));
        return true;
      case 'joinlevel':
        await interaction.editReply({ embeds: [await cmd.tentJoinLevel(interaction)] });
        return true;
      default: {
        const embed = embedTemplate().setTitle('Error').setColor(Colors.Red);
        await interaction.editReply({ embeds: [embed.setDescription('Invalid command')] });
        return false;
      }
    }
  },
};

export default dVoice;
