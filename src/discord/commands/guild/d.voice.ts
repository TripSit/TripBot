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

  // Disallow banning bots
  if (target.user.bot) {
    return embedTemplate()
      .setTitle('Error')
      .setColor(Colors.Red)
      .setDescription('You cannot ban bots');
  }

  // Disallow banning mods
  if (target.roles.cache.has(env.ROLE_MODERATOR) === true) {
    return embedTemplate()
      .setTitle('Error')
      .setColor(Colors.Red)
      .setDescription('You cannot ban mods');
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

async function tentRadio(
  voiceChannel: VoiceBasedChannel,
  stationid: string,
  guild: Guild,
):Promise<EmbedBuilder> {
  const radioChannels: { [key: string]: string } = {
    '830530156048285716': env.CHANNEL_LOFIRADIO,
    '861363156568113182': env.CHANNEL_JAZZRADIO,
    '833406944387268670': env.CHANNEL_SYNTHWAVERADIO,
    '831623165632577587': env.CHANNEL_SLEEPYRADIO,
  };

  // If the station choice was "none", send the radio back to the radio room
  if (stationid === 'none') {
    // Check if any radio bots are in the Tent
    const radioBot = voiceChannel.members.find(m => Object.keys(radioChannels).includes(m.user.id));
    if (!radioBot) {
      return embedTemplate()
        .setTitle('Error')
        .setColor(Colors.Red)
        .setDescription('There is already no radio in this Tent');
    }
    // Find what radio bot is in the Tent and use the corresponding radio channel from the radioChannels object
    // Check if the current channel has a radio bot in it
    //  by checking if any bots in the channel are in the radioChannels object
    const botMember = voiceChannel.members
      .find(member => member.user.bot && Object.keys(radioChannels).includes(member.user.id));
    if (botMember) {
      // If it does, find the corresponding radio channel from the bot id and move the bot to it
      const radioChannelId = radioChannels[botMember.user.id];
      // Get the radio channel from cache
      const radioChannel = guild.channels.cache.get(radioChannelId) as VoiceChannel;
      // If the radio channel exists, and is a voice channel, move the bot to it
      if (radioChannel && radioChannel.type === ChannelType.GuildVoice) {
        voiceChannel.members.forEach(member => {
          if (member.user.bot) {
            member.voice.setChannel(radioChannel.id);
          }
        });
      }
    }
    return embedTemplate()
      .setTitle('Success')
      .setColor(Colors.Green)
      .setDescription('The radio has been returned to the radio room');
  }

  const station = voiceChannel.guild.members.cache.get(stationid) as GuildMember;

  // If the station returns invalid (not on the server)
  if (!station) {
    return embedTemplate()
      .setTitle('Error')
      .setColor(Colors.Red)
      .setDescription('This radio wasn\'t found! Please report this to the mods');
  }

  // If the radio is offline
  if (!station.voice.channel) {
    return embedTemplate()
      .setTitle('Error')
      .setColor(Colors.Red)
      .setDescription('This radio is currently offline, please report this to the mods');
  }
  // If the radio is already in another Tent
  if (station.voice.channel?.parent?.id === env.CATEGORY_CAMPGROUND && station.voice.channelId !== voiceChannel.id) {
    return embedTemplate()
      .setTitle('Error')
      .setColor(Colors.Red)
      .setDescription('This radio is already being borrowed in another Tent');
  }
  // If the radio is already in the Tent
  if (station.voice.channelId === voiceChannel.id) {
    return embedTemplate()
      .setTitle('Error')
      .setColor(Colors.Red)
      .setDescription('This radio is already in your Tent');
  }
  // If the radio is available, move it to the Tent
  if (station.voice.channel?.parent?.id === env.CATEGORY_RADIO) {
    await station.voice.setChannel(voiceChannel);
    // Edit the corresponding radio channels name to indicate it is in use
    const radioChannelId = radioChannels[station.user.id];
    const radioChannel = station.guild.channels.cache.get(radioChannelId) as VoiceChannel;

    return embedTemplate()
      .setTitle('Success')
      .setColor(Colors.Green)
      .setDescription(`${station} has been borrowed to your Tent`);
  }
  // If the Tent already has a radio
  // find its corresonding channel in the radioChannels object and move it back before moving the new radio in
  const botMember = station.voice.channel.members
    .find(member => member.user.bot && Object.keys(radioChannels).includes(member.user.id));
  if (botMember) {
    // If it does, find the corresponding radio channel from the bot id and move the bot to it
    const radioChannelId = radioChannels[botMember.user.id];
    // Get the radio channel from cache
    const radioChannel = station.guild.channels.cache.get(radioChannelId) as VoiceChannel;
    // If the radio channel exists, and is a voice channel, move the bot to it
    if (radioChannel && radioChannel.type === ChannelType.GuildVoice) {
      radioChannel.members.forEach((member: GuildMember) => {
        if (member.user.bot) {
          member.voice.setChannel(radioChannel);
        }
      });
    }
    await station.voice.setChannel(voiceChannel);
  }

  // log.debug(F, `${target.displayName} is now ${verb}`);

  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`${station} has been borrowed to your Tent`);
}

async function tentBitrate(
  voiceChannel: VoiceBasedChannel,
  bitrate: string,
):Promise<EmbedBuilder> {
  const bitrateNumber = parseInt(bitrate, 10);
  // Check if the bitrate is the same as the current bitrate
  if (voiceChannel.bitrate === bitrateNumber * 1000) {
    return embedTemplate()
      .setTitle('Error')
      .setColor(Colors.Red)
      .setDescription(`The bitrate is already set to ${bitrate}kbps`);
  }
  // Change the bitrate
  await voiceChannel.setBitrate(bitrateNumber * 1000);
  return embedTemplate()
    .setTitle('Success')
    .setColor(Colors.Green)
    .setDescription(`The bitrate has been set to ${bitrate}kbps`);
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
      .setDescription('Lock/Unlock the Tent from new users'))
    .addSubcommand(subcommand => subcommand
      .setName('hide')
      .setDescription('Hide/Unhide the Tent from the channel list'))
    .addSubcommand(subcommand => subcommand
      .setName('ban')
      .setDescription('Ban/Unban and hide a user from your Tent')
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
      .setDescription('Make another member a co-host in your Tent')
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

    const command = interaction.options.getSubcommand() as 'lock' | 'hide' | 'ban' | 'rename' | 'mute' | 'cohost' | 'radio' | 'bitrate';
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

    if (command === 'radio') {
      embed = await tentRadio(voiceChannel, stationid, guild);
    }

    if (command === 'bitrate') {
      embed = await tentBitrate(voiceChannel, bitrate);
    }

    await interaction.editReply({ embeds: [embed] });
    return true;
  },
};

export default dVoice;
