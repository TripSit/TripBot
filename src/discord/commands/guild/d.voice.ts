import {
  Colors,
  SlashCommandBuilder,
  GuildMember,
  PermissionsBitField,
  EmbedBuilder,
  VoiceBasedChannel,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

async function tentRename(
  voiceChannel: VoiceBasedChannel,
  newName: string,
):Promise<EmbedBuilder> {
  voiceChannel.setName(`⛺│${newName}`);

  // log.debug(F, `${voiceChannel} hab been named to ${newName}`);

  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`${voiceChannel} has been renamed to ${newName}`);
}

async function tentLock(
  voiceChannel: VoiceBasedChannel,
):Promise<EmbedBuilder> {
  let verb = '';

  if (voiceChannel.permissionsFor(env.ROLE_VERIFIED).has(PermissionsBitField.Flags.Connect) === true) {
    voiceChannel.permissionOverwrites.edit(env.ROLE_VERIFIED, { Connect: false });
    verb = 'locked';
  } else {
    voiceChannel.permissionOverwrites.edit(env.ROLE_VERIFIED, { Connect: true });
    verb = 'unlocked';
  }

  // log.debug(F, `Channel is now ${verb}`);

  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`${voiceChannel} has been ${verb}`);
}

async function tentHide(
  voiceChannel: VoiceBasedChannel,
):Promise<EmbedBuilder> {
  let verb = '';

  if (voiceChannel.permissionsFor(env.ROLE_VERIFIED).has(PermissionsBitField.Flags.ViewChannel) === true) {
    voiceChannel.permissionOverwrites.edit(env.ROLE_VERIFIED, { ViewChannel: false });
    verb = 'hidden';
  } else {
    voiceChannel.permissionOverwrites.edit(env.ROLE_VERIFIED, { ViewChannel: true });
    verb = 'unhidden';
  }

  // log.debug(F, `Channel is now ${verb}`);

  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`${voiceChannel} has been ${verb}`);
}

async function tentBan(
  voiceChannel: VoiceBasedChannel,
  target: GuildMember,
):Promise<EmbedBuilder> {
  let verb = '';

  if (voiceChannel.permissionsFor(target).has(PermissionsBitField.Flags.ViewChannel) === true) {
    voiceChannel.permissionOverwrites.edit(target, { ViewChannel: false, Connect: false });
    if (target.voice.channel === voiceChannel) {
      target.voice.setChannel(null);
    }
    verb = 'banned and hidden';
  } else {
    voiceChannel.permissionOverwrites.edit(target, { ViewChannel: true, Connect: true });
    verb = 'unbanned and unhidden';
  }

  // log.debug(F, `${target.displayName} is now ${verb}`);

  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`${target} has been ${verb} from ${voiceChannel}`);
}

async function tentMute(
  voiceChannel: VoiceBasedChannel,
  target: GuildMember,
):Promise<EmbedBuilder> {
  let verb = '';

  if (voiceChannel.permissionsFor(target).has(PermissionsBitField.Flags.Speak) === true) {
    voiceChannel.permissionOverwrites.edit(target, { Speak: false });
    verb = 'muted';
    // log.debug(F, 'User is now muted');
  } else {
    voiceChannel.permissionOverwrites.edit(target, { Speak: true });
    verb = 'unmuted';
  }

  // log.debug(F, `${target.displayName} is now ${verb}`);

  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`${target} has been ${verb} in ${voiceChannel}`);
}

async function tentCohost(
  voiceChannel: VoiceBasedChannel,
  target: GuildMember,
):Promise<EmbedBuilder> {
  let verb = '';

  if (voiceChannel.permissionsFor(target).has(PermissionsBitField.Flags.MoveMembers) === false) {
    voiceChannel.permissionOverwrites.edit(target, { MoveMembers: true });
    verb = 'co-hosted';
    // log.debug(F, 'User is now muted');
  } else {
    voiceChannel.permissionOverwrites.edit(target, { MoveMembers: false });
    verb = 'removed as a co-host';
  }

  // log.debug(F, `${target.displayName} is now ${verb}`);

  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`${target} has been ${verb} in ${voiceChannel}`);
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
      .setName('lock')
      .setDescription('Lock the Tent from new users'))
    .addSubcommand(subcommand => subcommand
      .setName('hide')
      .setDescription('Hide the Tent from the channel list'))
    .addSubcommand(subcommand => subcommand
      .setName('ban')
      .setDescription('Ban and hide a user from your Tent')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to ban')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('mute')
      .setDescription('Mute a user in your Tent')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to mute')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('cohost')
      .setDescription('Make another member a co-host in your Tent')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to make co-host')
        .setRequired(true))),
  async execute(interaction) {
    startLog(F, interaction);
    await interaction.deferReply({ ephemeral: true });

    const command = interaction.options.getSubcommand() as 'lock' | 'hide' | 'ban' | 'rename' | 'mute' | 'cohost';
    const member = interaction.member as GuildMember;
    const target = interaction.options.getMember('target') as GuildMember;
    const newName = interaction.options.getString('name') as string;
    const voiceChannel = member.voice.channel;
    let embed = embedTemplate()
      .setTitle('Error')
      .setColor(Colors.Red)
      .setDescription('You can only use this command in a voice channel Tent that you own!');

    // Check if user is in a voice channel
    if (voiceChannel === null) {
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    // Check if user is in a Tent
    if (voiceChannel.name.includes('⛺') === false) {
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    // Check if a user is the one who created it, only users with MoveMembers permission can do this
    if (!voiceChannel.permissionsFor(member).has(PermissionsBitField.Flags.MoveMembers)) {
      await interaction.editReply({ embeds: [embed] });
      return false;
    }

    // Check the user is trying to act on themselves
    if (target === member) {
      await interaction.editReply({ embeds: [embed.setDescription('Stop playing with yourself!')] });
      return false;
    }

    // // Check if the target user is a moderator
    // if (target.roles.cache.has(env.ROLE_MODERATOR)) {
    //   await interaction.editReply({ embeds: [embed.setDescription('You cannot ban a moderator!')] });
    //   return false;
    // }

    // log.debug(F, `Command: ${command}`);
    if (command === 'rename') {
      embed = await tentRename(voiceChannel, newName);
    }

    if (command === 'lock') {
      embed = await tentLock(voiceChannel);
    }

    if (command === 'hide') {
      embed = await tentHide(voiceChannel);
    }

    if (command === 'ban') {
      embed = await tentBan(voiceChannel, target);
    }

    if (command === 'mute') {
      embed = await tentMute(voiceChannel, target);
    }

    if (command === 'cohost') {
      embed = await tentCohost(voiceChannel, target);
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dVoice;
