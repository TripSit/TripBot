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
import { getCommandLocalizations, getLocale, t } from '../../../i18n/index';

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

async function tentName(
  voiceChannel: VoiceBasedChannel,
  newName: string,
  locale: string,
):Promise<EmbedBuilder> {
  voiceChannel.setName(`⛺│${newName}`);

  const embed = new EmbedBuilder()
    .setTitle(t(locale, 'tent', 'tentUpdatedTitle'))
    .setColor(Colors.Blue)
    .setDescription(t(locale, 'tent', 'tentRenamedToDesc', { name: newName }));
  await voiceChannel.send({ embeds: [embed] });

  return embedTemplate()
    .setTitle(t(locale, 'tent', 'tentRenamedTitle'))
    .setColor(Colors.Green)
    .setDescription(t(locale, 'tent', 'tentRenamedDesc', { channel: voiceChannel.toString(), name: newName }));
}

async function tentLimit(
  voiceChannel: VoiceBasedChannel,
  limit: number,
  locale: string,
):Promise<EmbedBuilder> {
  let title = '';
  let description = '';
  if (limit === 0) {
    voiceChannel.setUserLimit(0);
    title = t(locale, 'tent', 'limitRemovedTitle');
    description = t(locale, 'tent', 'limitRemovedDesc');
  } else {
    voiceChannel.setUserLimit(limit);
    title = t(locale, 'tent', 'limitSetTitle');
    description = t(locale, 'tent', 'limitSetDesc', { limit: limit.toString() });
  }
  const embed = new EmbedBuilder()
    .setTitle(t(locale, 'tent', 'tentUpdatedTitle'))
    .setColor(Colors.Blue)
    .setDescription(limit === 0
      ? t(locale, 'tent', 'limitRemovedChannelDesc')
      : t(locale, 'tent', 'limitSetChannelDesc', { limit: limit.toString() }));
  await voiceChannel.send({ embeds: [embed] });
  return embedTemplate()
    .setTitle(title)
    .setColor(Colors.Green)
    .setDescription(description);
}

async function tentLevel(
  voiceChannel: VoiceBasedChannel,
  levelNumber: string,
  locale: string,
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
    title = t(locale, 'tent', 'levelRemovedTitle');
    description = t(locale, 'tent', 'levelRemovedDesc');
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
    title = t(locale, 'tent', 'levelSetTitle');
    description = t(locale, 'tent', 'levelSetDesc', { level: level.toString() });
  }

  const embed = new EmbedBuilder()
    .setTitle(t(locale, 'tent', 'tentUpdatedTitle'))
    .setColor(Colors.Blue)
    .setDescription(
      level === 0
        ? t(locale, 'tent', 'levelRemovedChannelDesc')
        : t(locale, 'tent', 'levelSetChannelDesc', { level: level.toString() }),
    );
  await voiceChannel.send({ embeds: [embed] });

  return embedTemplate()
    .setTitle(title)
    .setColor(Colors.Green)
    .setDescription(description);
}

async function tentLock(
  voiceChannel: VoiceBasedChannel,
  locale: string,
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
    title = t(locale, 'tent', 'lockedTitle');
    description = t(locale, 'tent', 'lockedDesc');
  } else {
    voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { Connect: true });
    title = t(locale, 'tent', 'unlockedTitle');
    description = t(locale, 'tent', 'unlockedDesc');
  }
  const embed = new EmbedBuilder()
    .setTitle(t(locale, 'tent', 'tentUpdatedTitle'))
    .setColor(Colors.Blue)
    .setDescription(t(locale, 'tent', 'lockChannelDesc', { state: title.toLowerCase() }));
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
  locale: string,
):Promise<EmbedBuilder> {
  if (newHost && newHost.voice.channel === voiceChannel) {
    voiceChannel.permissionOverwrites.edit(newHost.id, {
      Connect: true,
      MoveMembers: true,
    });
  } else {
    return embedTemplate()
      .setTitle(t(locale, 'tent', 'hostNotConnectedTitle'))
      .setColor(Colors.Red)
      .setDescription(t(locale, 'tent', 'hostNotConnectedDesc'));
  }
  if (oldHost) {
    voiceChannel.permissionOverwrites.edit(oldHost.id, {
      Connect: true,
      MoveMembers: null,
    });
  }
  const embed = new EmbedBuilder()
    .setTitle(t(locale, 'tent', 'tentUpdatedTitle'))
    .setColor(Colors.Blue)
    .setDescription(t(locale, 'tent', 'hostChannelDesc', { user: newHost.toString() }));
  await voiceChannel.send({
    content: `<@${newHost.id}>`,
    embeds: [embed],
  });
  voiceChannel.setName(`⛺│${newHost.displayName}'s tent`);
  return embedTemplate()
    .setTitle(t(locale, 'tent', 'hostTransferredTitle'))
    .setColor(Colors.Green)
    .setDescription(t(locale, 'tent', 'hostTransferredDesc', { user: newHost.toString() }));
}

async function tentAdd(
  voiceChannel: VoiceBasedChannel,
  target: GuildMember,
  locale: string,
):Promise<EmbedBuilder> {
  let title = '';
  let description = '';
  if (hasExplicitPermission(voiceChannel, target, PermissionsBitField.Flags.ViewChannel) === false) {
    voiceChannel.permissionOverwrites.create(target, { Connect: true, ViewChannel: true });
    return embedTemplate()
      .setTitle(t(locale, 'tent', 'userUnbannedAddedTitle'))
      .setColor(Colors.Green)
      .setDescription(t(locale, 'tent', 'userUnbannedAddedDesc', { user: target.toString() }));
  }
  if (target.roles.cache.has(env.ROLE_MODERATOR) === true) {
    return embedTemplate()
      .setTitle(t(locale, 'tent', 'userIsModTitle'))
      .setColor(Colors.Red)
      .setDescription(t(locale, 'tent', 'userIsModAddDesc'));
  }
  if (hasExplicitPermission(voiceChannel, target, PermissionsBitField.Flags.Connect) === null) {
    voiceChannel.permissionOverwrites.create(target, { Connect: true, ViewChannel: true });
    title = t(locale, 'tent', 'userAddedTitle');
    description = t(locale, 'tent', 'userAddedDesc', { user: target.toString() });
  } else {
    voiceChannel.permissionOverwrites.delete(target);
    title = t(locale, 'tent', 'userUnaddedTitle');
    description = t(locale, 'tent', 'userUnaddedDesc', { user: target.toString() });
  }
  return embedTemplate()
    .setTitle(title)
    .setColor(Colors.Green)
    .setDescription(description);
}

async function tentBan(
  voiceChannel: VoiceBasedChannel,
  target: GuildMember,
  locale: string,
):Promise<EmbedBuilder> {
  let title = '';
  let description = '';

  if (target.roles.cache.has(env.ROLE_MODERATOR) === true) {
    return embedTemplate()
      .setTitle(t(locale, 'tent', 'userIsModTitle'))
      .setColor(Colors.Red)
      .setDescription(t(locale, 'tent', 'userIsModBanDesc'));
  }

  if (hasExplicitPermission(voiceChannel, target, PermissionsBitField.Flags.ViewChannel) === false) {
    voiceChannel.permissionOverwrites.delete(target);
    title = t(locale, 'tent', 'userUnbannedTitle');
    description = t(locale, 'tent', 'userUnbannedDesc', { user: target.toString() });
  } else if (hasExplicitPermission(voiceChannel, target, PermissionsBitField.Flags.MoveMembers) === true) {
    voiceChannel.permissionOverwrites.edit(target, { Connect: false, ViewChannel: false });
    target.voice.setChannel(null);
    title = t(locale, 'tent', 'userBannedTitle');
    description = t(locale, 'tent', 'userBannedDesc', { user: target.toString() });
  } else {
    voiceChannel.permissionOverwrites.create(target, { Connect: false, ViewChannel: false });
    target.voice.setChannel(null);
    title = t(locale, 'tent', 'userBannedTitle');
    description = t(locale, 'tent', 'userBannedDesc', { user: target.toString() });
  }

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
  locale: string,
): Promise<EmbedBuilder> {
  const role = voiceChannel.guild.roles.cache.get(env.ROLE_JOINVC);
  if (role) {
    const now = Date.now();
    const userId = member.id;

    if (userTentPingTimes[userId] && now - userTentPingTimes[userId] < userCooldown) {
      return embedTemplate()
        .setTitle(t(locale, 'tent', 'cooldownTitle'))
        .setColor(Colors.Red)
        .setDescription(t(locale, 'tent', 'cooldownUserDesc', {
          time: Math.floor(userTentPingTimes[userId] / 1000).toString(),
          nextTime: Math.floor((userTentPingTimes[userId] + userCooldown) / 1000).toString(),
        }));
    }

    if (now - lastTentPingTime < globalCooldown) {
      return embedTemplate()
        .setTitle(t(locale, 'tent', 'cooldownTitle'))
        .setColor(Colors.Red)
        .setDescription(t(locale, 'tent', 'cooldownGlobalDesc', {
          nextTime: Math.floor((lastTentPingTime + globalCooldown) / 1000).toString(),
        }));
    }

    lastTentPingTime = now;
    userTentPingTimes[userId] = now;

    const channelID = env.CHANNEL_LOUNGE;
    const channel = member.guild.channels.cache.get(channelID) as TextChannel | undefined;
    if (!channel || !(channel instanceof TextChannel)) {
      return embedTemplate()
        .setTitle(t(locale, 'tent', 'badErrorTitle'))
        .setColor(Colors.Red)
        .setDescription(t(locale, 'tent', 'loungeNotFoundError'));
    }

    channel.send(`<@${member.id}> wants you to <@&${role.id}> in ${voiceChannel}!`);
    return embedTemplate()
      .setTitle(t(locale, 'tent', 'pingSentTitle'))
      .setColor(Colors.Green)
      .setDescription(t(locale, 'tent', 'pingSentDesc', { channel: env.CHANNEL_LOUNGE }));
  }

  return embedTemplate()
    .setTitle(t(locale, 'tent', 'badErrorTitle'))
    .setColor(Colors.Red)
    .setDescription(t(locale, 'tent', 'vcRoleNotFoundError'));
}

export const dVoice: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName(t('en-US', 'tent', 'commandName'))
    .setNameLocalizations(getCommandLocalizations('tent', 'commandName'))
    .setDescription(t('en-US', 'tent', 'commandDescription'))
    .setDescriptionLocalizations(getCommandLocalizations('tent', 'commandDescription'))
    .addSubcommand(subcommand => subcommand
      .setName('name')
      .setDescription(t('en-US', 'tent', 'nameSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('tent', 'nameSubcommand'))
      .addStringOption(option => option
        .setName('name')
        .setDescription(t('en-US', 'tent', 'nameOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tent', 'nameOption'))
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('limit')
      .setDescription(t('en-US', 'tent', 'limitSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('tent', 'limitSubcommand'))
      .addIntegerOption(option => option
        .setName('limit')
        .setDescription(t('en-US', 'tent', 'limitOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tent', 'limitOption'))
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(99)))
    .addSubcommand(subcommand => subcommand
      .setName('host')
      .setDescription(t('en-US', 'tent', 'hostSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('tent', 'hostSubcommand'))
      .addUserOption(option => option
        .setName('target')
        .setDescription(t('en-US', 'tent', 'hostTargetOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tent', 'hostTargetOption'))
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('lock')
      .setDescription(t('en-US', 'tent', 'lockSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('tent', 'lockSubcommand')))
    .addSubcommand(subcommand => subcommand
      .setName('level')
      .setDescription(t('en-US', 'tent', 'levelSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('tent', 'levelSubcommand'))
      .addStringOption(option => option
        .setName('level')
        .setDescription(t('en-US', 'tent', 'levelOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tent', 'levelOption'))
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
      .setDescription(t('en-US', 'tent', 'addSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('tent', 'addSubcommand'))
      .addUserOption(option => option
        .setName('target')
        .setDescription(t('en-US', 'tent', 'addTargetOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tent', 'addTargetOption'))
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('ban')
      .setDescription(t('en-US', 'tent', 'banSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('tent', 'banSubcommand'))
      .addUserOption(option => option
        .setName('target')
        .setDescription(t('en-US', 'tent', 'banTargetOption'))
        .setDescriptionLocalizations(getCommandLocalizations('tent', 'banTargetOption'))
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('ping')
      .setDescription(t('en-US', 'tent', 'pingSubcommand'))
      .setDescriptionLocalizations(getCommandLocalizations('tent', 'pingSubcommand'))),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const locale = await getLocale(interaction, 'tent');

    const command = interaction.options.getSubcommand() as VoiceActions;
    const member = interaction.member as GuildMember;
    const target = interaction.options.getMember('target') as GuildMember;
    const newName = interaction.options.getString('name') as string;
    const limit = interaction.options.getInteger('limit') as number;
    const level = interaction.options.getString('level') as string;

    let embed = embedTemplate()
      .setTitle(t(locale, 'tent', 'errorTitle'))
      .setColor(Colors.Red)
      .setDescription(t(locale, 'tent', 'notOwnerError'));

    let voiceChannel = member.voice.channel;
    if (!voiceChannel && member.roles.cache.has(env.ROLE_MODERATOR)) {
      if (interaction.channel?.isVoiceBased()) {
        voiceChannel = interaction.channel as VoiceBasedChannel;
      } else {
        embed = embedTemplate()
          .setTitle(t(locale, 'tent', 'errorTitle'))
          .setColor(Colors.Red)
          .setDescription(t(locale, 'tent', 'notModeratorVoiceError'));
        await interaction.editReply({ embeds: [embed] });
        return false;
      }
    }

    if (!voiceChannel) {
      embed = embedTemplate()
        .setTitle(t(locale, 'tent', 'errorTitle'))
        .setColor(Colors.Red)
        .setDescription(t(locale, 'tent', 'notInVoiceError'));
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    if (!voiceChannel.name.includes('⛺')) {
      embed = embedTemplate()
        .setTitle(t(locale, 'tent', 'errorTitle'))
        .setColor(Colors.Red)
        .setDescription(t(locale, 'tent', 'notInTentError'));
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    if (!voiceChannel.permissionsFor(member).has(PermissionsBitField.Flags.MoveMembers)) {
      embed = embedTemplate()
        .setTitle(t(locale, 'tent', 'errorTitle'))
        .setColor(Colors.Red)
        .setDescription(t(locale, 'tent', 'notHostError'));
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    if (target === member) {
      embed = embedTemplate()
        .setTitle(t(locale, 'tent', 'errorTitle'))
        .setColor(Colors.Red)
        .setDescription(t(locale, 'tent', 'selfActionError'));
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    if (target && target.user.bot) {
      embed = embedTemplate()
        .setTitle(t(locale, 'tent', 'errorTitle'))
        .setColor(Colors.Red)
        .setDescription(t(locale, 'tent', 'botTargetError'));
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    if (command === 'name') {
      embed = await tentName(voiceChannel, newName, locale);
    }

    if (command === 'lock') {
      embed = await tentLock(voiceChannel, locale);
    }

    if (command === 'limit') {
      embed = await tentLimit(voiceChannel, limit, locale);
    }

    if (command === 'host') {
      embed = await tentHost(voiceChannel, target, member, locale);
    }

    if (command === 'level') {
      embed = await tentLevel(voiceChannel, level, locale);
    }

    if (command === 'add') {
      embed = await tentAdd(voiceChannel, target, locale);
    }

    if (command === 'ban') {
      embed = await tentBan(voiceChannel, target, locale);
    }

    if (command === 'ping') {
      embed = await tentPing(voiceChannel, member, locale);
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dVoice;
