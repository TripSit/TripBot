import {
  VoiceChannel,
  ChannelType,
  Guild,
  Colors,
  SlashCommandBuilder,
  GuildMember,
  PermissionsBitField,
  EmbedBuilder,
  VoiceBasedChannel,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';

const F = f(__filename);

type VoiceActions = 'lock' | 'hide' | 'add' | 'ban' | 'rename' | 'mute' | 'cohost' | 'radio' | 'bitrate';

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
  if (
    voiceChannel
      .permissionsFor(voiceChannel.guild.roles.everyone)
      .has(PermissionsBitField.Flags.Connect) === true
  ) {
    voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { Connect: false });
    verb = 'locked';
  } else {
    voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { Connect: true });
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

  if (
    voiceChannel
      .permissionsFor(voiceChannel.guild.roles.everyone)
      .has(PermissionsBitField.Flags.ViewChannel) === true
  ) {
    voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { ViewChannel: false });
    verb = 'hidden';
  } else {
    voiceChannel.permissionOverwrites.edit(voiceChannel.guild.roles.everyone, { ViewChannel: true });
    verb = 'unhidden';
  }

  // log.debug(F, `Channel is now ${verb}`);

  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`${voiceChannel} has been ${verb}`);
}

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
//     verb = 'unadded';
//   }
//   // log.debug(F, `${target.displayName} is now ${verb}`);
// 
//   return embedTemplate()
//     .setTitle('Success')
//     .setColor(Colors.Green)
//     .setDescription(`${target} has been ${verb} from ${voiceChannel}`);
// }

async function tentBan(
  voiceChannel: VoiceBasedChannel,
  target: GuildMember,
):Promise<EmbedBuilder> {
  let verb = '';

  if (!voiceChannel.permissionsFor(target).has(PermissionsBitField.Flags.ViewChannel) === false) {
    voiceChannel.permissionOverwrites.edit(target, { ViewChannel: false, Connect: false });
    if (target.voice.channel === voiceChannel) {
      target.voice.setChannel(null);
    }
    verb = 'banned and disconnected';
  } else {
    voiceChannel.permissionOverwrites.delete(target);;
    verb = 'unbanned';
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
      .setDescription('Lock/Unlock the Tent'))
    .addSubcommand(subcommand => subcommand
      .setName('hide')
      .setDescription('Remove the Tent from the channel list'))
    // .addSubcommand(subcommand => subcommand
    //   .setName('add')
    //   .setDescription('Allow a user to join your Tent when locked or hidden')
    //   .addUserOption(option => option
    //     .setName('target')
    //     .setDescription('The user to add/unadd')
    //     .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('ban')
      .setDescription('Ban and disconnect a user from your Tent')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to ban/unban')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('mute')
      .setDescription('Mute/Unmute a user in your Tent')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to mute')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('cohost')
      .setDescription('Make another user able to use /voice commands')
      .addUserOption(option => option
        .setName('target')
        .setDescription('The user to make co-host')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('radio')
      .setDescription('Borrow a radio bot for your Tent')
      .addStringOption(option => option
        .setName('station')
        .setDescription('The radio station to borrow')
        .setRequired(true)
        .addChoices(
          { name: 'Lofi', value: '830530156048285716' },
          { name: 'Jazz', value: '861363156568113182' },
          { name: 'Synthwave', value: '833406944387268670' },
          { name: 'Sleepy', value: '831623165632577587' },
          { name: 'None', value: 'none' },
        )))
    .addSubcommand(subcommand => subcommand
      .setName('bitrate')
      .setDescription('Change the bitrate of your Tent')
      .addStringOption(option => option
        .setName('bitrate')
        .setDescription('The bitrate to set')
        .setRequired(true)
        .addChoices(
          { name: 'Potato (8kbps)', value: '8' },
          { name: 'Low (32kbps)', value: '16' },
          { name: 'Default (64kbps)', value: '64' },
          { name: 'Medium (128kbps)', value: '128' },
          { name: 'High (256kbps)', value: '256' },
          { name: 'Ultra (384kbps)', value: '384' },
        ))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });

    const command = interaction.options.getSubcommand() as VoiceActions;
    const member = interaction.member as GuildMember;
    const target = interaction.options.getMember('target') as GuildMember;
    const newName = interaction.options.getString('name') as string;
    const stationid = interaction.options.getString('station') as string;
    const guild = interaction.guild as Guild;
    const bitrate = interaction.options.getString('bitrate') as string;
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

    // Check if the target user is a moderator
    if (target){
      if (target.roles.cache.has(env.ROLE_MODERATOR)) {
        await interaction.editReply({ embeds: [embed.setDescription('You cannot do that to a moderator!')] });
        return false;
      }
    }

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

    // if (command === 'add') {
    //   embed = await tentAdd(voiceChannel, target);
    // }

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
