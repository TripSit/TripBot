/* eslint-disable sonarjs/no-duplicate-string */
import {
  // Guild,
  Colors,
  SlashCommandBuilder,
  GuildMember,
  PermissionsBitField,
  EmbedBuilder,
  VoiceBasedChannel,
  TextChannel,
  MessageFlags,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';

const F = f(__filename);

type VoiceActions = 'lock' | 'level' | 'limit' | 'host' | 'add' | 'ban' | 'name' | 'ping';

// Helper function to check if a user has an explicit permission overwrite
function hasExplicitPermission(channel: VoiceBasedChannel, member: GuildMember, permission: bigint): boolean | null {
  const overwrite = channel.permissionOverwrites.cache.get(member.id);
  if (!overwrite) {
    return null; // No explicit permission overwrite
  }
  if (overwrite.allow.has(permission)) {
    return true; // Explicitly allowed
  }
  if (overwrite.deny.has(permission)) {
    return false; // Explicitly denied
  }
  return null; // No explicit permission overwrite for this permission
}

/* DISABLED DUE TO CONCERNS OVER SERVER BEING DE-LISTED FOR "BAD" CHANNEL NAMES
async function tentName(
  voiceChannel: VoiceBasedChannel,
  newName: string,
):Promise<EmbedBuilder> {
  voiceChannel.setName(`⛺│${newName}`);

  // Send the tent update message
  const embed = new EmbedBuilder()
    .setTitle('Tent updated')
    .setColor(Colors.Blue)
    .setDescription(`Tent renamed to "${newName}".`);
  await voiceChannel.send({ embeds: [embed] });

  return embedTemplate()
    .setTitle('Tent renamed')
    .setColor(Colors.Green)
    .setDescription(`${voiceChannel} has been renamed to "${newName}"`);
}
*/

async function tentLimit(
  voiceChannel: VoiceBasedChannel,
  limit: number,
):Promise<EmbedBuilder> {
  let title = '';
  let description = '';
  if (limit === 0) {
    voiceChannel.setUserLimit(0);
    title = 'User limit removed';
    description = 'Your tent now has no user limit.';
  } else {
    voiceChannel.setUserLimit(limit);
    title = 'User limit set';
    description = `Your tent now has a user limit of ${limit}.`;
  }
  // Send the tent update message
  const embed = new EmbedBuilder()
    .setTitle('Tent updated')
    .setColor(Colors.Blue)
    .setDescription(limit === 0
      ? 'There is now no user limit.'
      : `The tent now has a max user limit of ${limit}.`);
  await voiceChannel.send({ embeds: [embed] });
  // log.debug(F, `Channel limit set to ${limit}`);
  return embedTemplate()
    .setTitle(title)
    .setColor(Colors.Green)
    .setDescription(description);
}

async function tentLevel(
  voiceChannel: VoiceBasedChannel,
  levelNumber: string,
): Promise<EmbedBuilder> {
  const level = parseInt(levelNumber, 10);
  let title = '';
  let description = '';

  const levelRoles: { [key: number]: string } = {
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

  if (level === 0) {
    // Iterate over all the level roles and remove their overwrites
    Object.values(levelRoles).forEach(roleId => {
      const role = voiceChannel.guild.roles.cache.get(roleId);
      if (role) {
        voiceChannel.permissionOverwrites.delete(role);
      }
    });
    title = 'Level requirement removed';
    description = 'Your tent now has no level requirement.';
  } else {
    // Add permissions for all roles below the level
    Object.keys(levelRoles).forEach(key => {
      const roleLevel = parseInt(key, 10);
      if (roleLevel < level) {
        const roleId = levelRoles[roleLevel];
        const role = voiceChannel.guild.roles.cache.get(roleId);
        if (role) {
          voiceChannel.permissionOverwrites.edit(role, { Connect: false, ViewChannel: false });
        }
      }
      if (roleLevel >= level) {
        const roleId = levelRoles[roleLevel];
        const role = voiceChannel.guild.roles.cache.get(roleId);
        if (role) {
          voiceChannel.permissionOverwrites.delete(role);
        }
      }
    });
    title = 'Level requirement set';
    description = `Only users level ${level} or higher can join your tent.`;
  }

  // Send the tent update message
  const embed = new EmbedBuilder()
    .setTitle('Tent updated')
    .setColor(Colors.Blue)
    .setDescription(
      level === 0
        ? 'There is now no level requirement to join this tent.'
        : `Only users level ${level} or higher can join this tent.`,
    );
  await voiceChannel.send({ embeds: [embed] });

  return embedTemplate()
    .setTitle(title)
    .setColor(Colors.Green)
    .setDescription(description);
}

async function tentLock(
  voiceChannel: VoiceBasedChannel,
):Promise<EmbedBuilder> {
  let title = '';
  let description = '';
  if (
    voiceChannel
      .permissionsFor(voiceChannel.guild.roles.everyone)
      .has(PermissionsBitField.Flags.Connect) === true
  ) {
    voiceChannel.members.forEach(member => {
      voiceChannel.permissionOverwrites.edit(member, { Connect: true });
    });
    voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { Connect: false });
    title = 'Locked';
    description = `Currently joined users have been automatically \`/add\`ed and will be able to rejoin if they disconnect.

    Note: Mods can still join locked tents, though only if deemed necessary.`;
  } else {
    voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { Connect: true });
    title = 'Unlocked';
    description = 'Your tent is now open to everyone not `/tent ban`ned.';
  }
  // log.debug(F, `Channel is now ${verb}`);
  // Send the tent update message
  const embed = new EmbedBuilder()
    .setTitle('Tent updated')
    .setColor(Colors.Blue)
    .setDescription(`
    The tent has been ${title.toLowerCase()}.`);
  await voiceChannel.send({ embeds: [embed] });

  return embedTemplate()
    .setTitle(title)
    .setColor(Colors.Green)
    .setDescription(description);
}

async function tentHost(
  voiceChannel: VoiceBasedChannel,
  newHost: GuildMember,
  oldHost: GuildMember,
):Promise<EmbedBuilder> {
  let title = '';
  let description = '';
  // Add new host permissions
  if (newHost && newHost.voice.channel === voiceChannel) {
    voiceChannel.permissionOverwrites.edit(newHost.id, {
      Connect: true,
      MoveMembers: true,
    });
  } else {
    return embedTemplate()
      .setTitle('User not connected')
      .setColor(Colors.Red)
      .setDescription(`The new host must be in the tent to be set as the host.
        Please pick a user that is currently in the tent.`);
  }
  // Remove the host permissions
  if (oldHost) {
    voiceChannel.permissionOverwrites.edit(oldHost.id, {
      Connect: true,
      MoveMembers: null, // Set to neutral
    });
  }
  title = 'Host transferred';
  description = `The new host is ${newHost}.`;
  // log.debug(F, `${oldHost.displayName} is now ${verb}`);
  const embed = new EmbedBuilder()
    .setTitle('Tent updated')
    .setColor(Colors.Blue)
    .setDescription(`
    ${newHost} is now host.
    The host can use \`/tent\` commands.
    `);
  await voiceChannel.send({
    content: `<@${newHost.id}>`,
    embeds: [embed],
  });
  // Rename the channel
  voiceChannel.setName(`⛺│${newHost.displayName}'s tent`);
  return embedTemplate()
    .setTitle(title)
    .setColor(Colors.Green)
    .setDescription(description);
}

async function tentAdd(
  voiceChannel: VoiceBasedChannel,
  target: GuildMember,
):Promise<EmbedBuilder> {
  let title = '';
  let description = '';
  // Check if the user is banned
  if (hasExplicitPermission(voiceChannel, target, PermissionsBitField.Flags.ViewChannel) === false) {
    voiceChannel.permissionOverwrites.create(target, { Connect: true, ViewChannel: true });
    return embedTemplate()
      .setTitle('User unbanned and added')
      .setColor(Colors.Green)
      .setDescription(`${target} has been unbanned and added to the tent.`);
  }
  // Check if the user is a mod
  if (target.roles.cache.has(env.ROLE_MODERATOR) === true) {
    return embedTemplate()
      .setTitle('User is a moderator')
      .setColor(Colors.Red)
      .setDescription('Moderators are already able to join all tents.');
  }
  if (hasExplicitPermission(voiceChannel, target, PermissionsBitField.Flags.Connect) === null) {
    voiceChannel.permissionOverwrites.create(target, { Connect: true, ViewChannel: true });
    title = 'User added';
    description = `${target} can now join, regardless of other settings.`;
  } else {
    voiceChannel.permissionOverwrites.delete(target);
    title = 'User un-added';
    description = `${target}'s permissions are reset to default.`;
  }
  // log.debug(F, `${target.displayName} is now ${verb}`);
  return embedTemplate()
    .setTitle(title)
    .setColor(Colors.Green)
    .setDescription(description);
}

async function tentBan(
  voiceChannel: VoiceBasedChannel,
  target: GuildMember,
):Promise<EmbedBuilder> {
  let title = '';
  let description = '';

  // Check if the user is a mod
  if (target.roles.cache.has(env.ROLE_MODERATOR) === true) {
    return embedTemplate()
      .setTitle('User is a moderator')
      .setColor(Colors.Red)
      .setDescription('You cannot ban a moderator! They can join all tents.');
  }

  // Check if the user is already banned using the ViewChannel permission and the hasExplicitPermission function
  if (hasExplicitPermission(voiceChannel, target, PermissionsBitField.Flags.ViewChannel) === false) {
    voiceChannel.permissionOverwrites.delete(target);
    title = 'User unbanned';
    description = `${target}'s permissions reset to default.`;
    // Edge case: Check if the user is the host and transfer
  } else if (hasExplicitPermission(voiceChannel, target, PermissionsBitField.Flags.MoveMembers) === true) {
    voiceChannel.permissionOverwrites.edit(target, { Connect: false, ViewChannel: false });
    target.voice.setChannel(null);
    title = 'User banned';
    description = `${target} has been banned from the tent. They can no longer view or join this channel.`;
  } else {
    voiceChannel.permissionOverwrites.create(target, { Connect: false, ViewChannel: false });
    target.voice.setChannel(null);
    title = 'User banned';
    description = `${target} has been banned from the tent. They can no longer view or join this channel.`;
  }

  // log.debug(F, `${target.displayName} is now ${verb}`);

  return embedTemplate()
    .setTitle(title)
    .setColor(Colors.Green)
    .setDescription(description);
}

// Command that makes the bot ping the Join VC role
let lastTentPingTime = Date.now() - 3600000; // Initialize to one hour ago
const userTentPingTimes: { [userId: string]: number } = {}; // Initialize an empty object to store user ping times
const globalCooldown = 3600000; // 1 hour
const userCooldown = 10800000; // 3 hours

async function tentPing(
  voiceChannel: VoiceBasedChannel,
  member: GuildMember,
): Promise<EmbedBuilder> {
  const role = voiceChannel.guild.roles.cache.get(env.ROLE_JOINVC);
  if (role) {
    const now = Date.now();
    const userId = member.id;

    // Check if the user used the command less than the user cooldown
    if (userTentPingTimes[userId] && now - userTentPingTimes[userId] < userCooldown) {
      return embedTemplate()
        .setTitle('Cooldown')
        .setColor(Colors.Red)
        .setDescription(`You already used this command <t:${Math.floor(userTentPingTimes[userId] / 1000)}:R>.
        You can use it again <t:${Math.floor((userTentPingTimes[userId] + userCooldown) / 1000)}:R>.`);
    }

    // Check if the command was used less than the global cooldown
    if (now - lastTentPingTime < globalCooldown) {
      return embedTemplate()
        .setTitle('Cooldown')
        .setColor(Colors.Red)
        .setDescription(`This command is on cooldown.
        It can next be used <t:${Math.floor((lastTentPingTime + globalCooldown) / 1000)}:R>.`);
    }

    // Update the last usage times
    lastTentPingTime = now;
    userTentPingTimes[userId] = now;

    // Ping the role
    // Get the lounge channel
    const channelID = env.CHANNEL_LOUNGE;
    const channel = member.guild.channels.cache.get(channelID) as TextChannel | undefined;
    if (!channel || !(channel instanceof TextChannel)) {
      return embedTemplate()
        .setTitle('BAD ERROR')
        .setColor(Colors.Red)
        .setDescription(
          'The lounge channel could not be found. This should not have happened, please contact a developer.',
        );
    }

    // Send the ping
    channel.send(`<@${member.id}> wants you to <@&${role.id}> in ${voiceChannel}!`);
    // Send the confirmation message
    return embedTemplate()
      .setTitle('Ping sent')
      .setColor(Colors.Green)
      .setDescription(`The Join VC role has been pinged in <#${env.CHANNEL_LOUNGE}>.`);
  }

  return embedTemplate()
    .setTitle('BAD ERROR')
    .setColor(Colors.Red)
    .setDescription('The Join VC role could not be found. This should not have happened, please contact a developer.');
}

export const dVoice: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('tent')
    .setDescription('Control your Campfire Tent')
    // .addSubcommand(subcommand => subcommand
    //   .setName('name')
    //   .setDescription('Rename your Tent')
    //   .addStringOption(option => option
    //     .setName('name')
    //     .setDescription('The new name for your Tent')
    //     .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('limit')
      .setDescription('Set a limit on the number of users in your Tent')
      .addIntegerOption(option => option
        .setName('limit')
        .setDescription('The new limit for your Tent (0 = No limit)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(99)))
    .addSubcommand(subcommand => subcommand
      .setName('host')
      .setDescription('Transfer host to another user')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to transfer host to')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('lock')
      .setDescription('Lock/Unlock your Tent'))
    .addSubcommand(subcommand => subcommand
      .setName('level')
      .setDescription('Set a level requirement for your Tent')
      .addStringOption(option => option
        .setName('level')
        .setDescription('The new level requirement for your Tent')
        .setChoices([
          { name: 'None', value: '0' },
          { name: '10', value: '10' },
          { name: '20', value: '20' },
          { name: '30', value: '30' },
          { name: '40', value: '40' },
          { name: '50', value: '50' },
          { name: '60', value: '60' },
          { name: '70', value: '70' },
          { name: '80', value: '80' },
          { name: '90', value: '90' },
          { name: '100', value: '100' },
        ])
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription('Allow a user to join your Tent when locked or hidden')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to add/unadd')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('ban')
      .setDescription('Ban and disconnect a user from your Tent')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to ban/unban')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('ping')
      .setDescription('Ping the Join VC role')),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const command = interaction.options.getSubcommand() as VoiceActions;
    const member = interaction.member as GuildMember;
    const target = interaction.options.getMember('target') as GuildMember;
    // const newName = interaction.options.getString('name') as string;
    const limit = interaction.options.getInteger('limit') as number;
    const level = interaction.options.getString('level') as string;

    let embed = embedTemplate()
      .setTitle('Error')
      .setColor(Colors.Red)
      .setDescription('You can only use this command in a voice channel Tent that you own!');

    // Determine the voice channel
    let voiceChannel = member.voice.channel;
    if (!voiceChannel && member.roles.cache.has(env.ROLE_MODERATOR)) {
      // If the user is a moderator and not in a voice channel, use the channel where the command was executed
      if (interaction.channel?.isVoiceBased()) {
        voiceChannel = interaction.channel as VoiceBasedChannel;
      } else {
        embed = embedTemplate()
          .setTitle('Error')
          .setColor(Colors.Red)
          .setDescription(
            'You must be in a voice channel or use this command in a voice channel\'s text chat as a moderator.',
          );
        await interaction.editReply({ embeds: [embed] });
        return false;
      }
    }

    // If no voice channel is determined, return an error
    if (!voiceChannel) {
      embed = embedTemplate()
        .setTitle('Error')
        .setColor(Colors.Red)
        .setDescription('You must be in a voice channel to use this command.');
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    // Check if user is in a Tent
    if (!voiceChannel.name.includes('⛺')) {
      embed = embedTemplate()
        .setTitle('Error')
        .setColor(Colors.Red)
        .setDescription('You can only use this command in a Tent.');
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    // Check if a user is the current host or mod/admin, only users with MoveMembers permission can do this
    if (!voiceChannel.permissionsFor(member).has(PermissionsBitField.Flags.MoveMembers)) {
      embed = embedTemplate()
        .setTitle('Error')
        .setColor(Colors.Red)
        .setDescription('You must be the host or a moderator to use this command.');
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    // Check the user is trying to act on themselves
    if (target === member) {
      embed = embedTemplate()
        .setTitle('Error')
        .setColor(Colors.Red)
        .setDescription('Stop playing with yourself!');
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    // Check if the target is a bot
    if (target && target.user.bot) {
      embed = embedTemplate()
        .setTitle('Error')
        .setColor(Colors.Red)
        .setDescription('You cannot interact with bots.');
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    // if (command === 'name') {
    //   embed = await tentName(voiceChannel, newName);
    // }

    if (command === 'lock') {
      embed = await tentLock(voiceChannel);
    }

    if (command === 'limit') {
      embed = await tentLimit(voiceChannel, limit);
    }

    if (command === 'host') {
      embed = await tentHost(voiceChannel, target, member);
    }

    if (command === 'level') {
      embed = await tentLevel(voiceChannel, level);
    }

    if (command === 'add') {
      embed = await tentAdd(voiceChannel, target);
    }

    if (command === 'ban') {
      embed = await tentBan(voiceChannel, target);
    }

    if (command === 'ping') {
      embed = await tentPing(voiceChannel, member);
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dVoice;
