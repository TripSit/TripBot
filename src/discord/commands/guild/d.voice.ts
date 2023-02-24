/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ModalSubmitInteraction,
  GuildMember,
  PermissionsBitField
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { globalTemplate } from '../../../global/commands/_g.template';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dVoice;

export const dVoice: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('Control your Campfire Tent')
    .addSubcommand(subcommand => subcommand
      .setName('lock')
      .setDescription('Prevent users from joining'))
    .addSubcommand(subcommand => subcommand
      .setName('hide')
      .setDescription('Hide from the channel')),
  async execute(interaction) {
    startLog(F, interaction);

    let command = interaction.options.getSubcommand() as 'lock' | 'hide';
    const member = interaction.member as GuildMember;
    const toggle = interaction.options.getSubcommand();
    const voiceChannel = member.voice.channel;
    let verb = 'error';
    console.log(`Command: ${command}`)
    if (command === 'lock') {

      // Check if user is in a voice channel
      if (voiceChannel === null) {
        await interaction.reply({
          content: 'You need to be connected to a voice channel to use this command!',
          ephemeral: true,
        });
        return false;
      }
      // Check if user is in a Tent
      else {
        if (voiceChannel.name.includes('tent') === false) {
          await interaction.reply({
            content: 'You need to be in your Tent to use this command!',
            ephemeral: true,
          });
          return false;
        }
        // Check if user has mute members permission
        if (voiceChannel && (voiceChannel.permissionsFor(member).has(PermissionsBitField.Flags.MuteMembers))) {
        console.log(`User has the "mute members" permission in ${voiceChannel.name}`);
        // Check if the channel is already locked, and unlock it if so
          if (voiceChannel.permissionsFor(env.ROLE_VERIFIED).has(PermissionsBitField.Flags.Connect) === false) {
          console.log(`${voiceChannel.permissionsFor(env.ROLE_VERIFIED).has(PermissionsBitField.Flags.Connect)}`)
          voiceChannel.permissionOverwrites.edit(env.ROLE_VERIFIED, {Connect: true});
          verb = 'unlocked';
          console.log('Channel was locked and has been unlocked')
          }
          // Else, lock the channel
          else {
          voiceChannel.permissionOverwrites.edit(env.ROLE_VERIFIED, {Connect: false});
          verb = 'locked';
          console.log('Channel is now locked')
          }
        }
        else {
        await interaction.reply({
        content: 'You do not own this Tent!',
        ephemeral: true,
        });
        console.log(`User does not have the "mute members" permission in ${voiceChannel.name}`);
      }
    
      await interaction.reply({
      content: `${voiceChannel} has been ${verb}`,
      ephemeral: true,
      });
      return true;
    }
    };

    if (command === 'hide') {

      // Check if user is in a voice channel
      if (voiceChannel === null) {
        await interaction.reply({
          content: 'You need to be connected to a Campfire Tent to use this command!',
          ephemeral: true,
        });
        return false;
      }
      // Check if user is in a Tent
      else {
        if (voiceChannel.name.includes('tent') === false) {
          await interaction.reply({
            content: 'You need to be in your Tent to use this command!',
            ephemeral: true,
          });
          return false;
        }
        // Check if user has mute members permission
        if (voiceChannel && (voiceChannel.permissionsFor(member).has(PermissionsBitField.Flags.MuteMembers))) {
        console.log(`User has the "mute members" permission in ${voiceChannel.name}`);
        // Check if the channel is already hidden, and unhide it if so
          if (voiceChannel.permissionsFor(env.ROLE_VERIFIED).has(PermissionsBitField.Flags.ViewChannel) === false) {
          console.log(`${voiceChannel.permissionsFor(env.ROLE_VERIFIED).has(PermissionsBitField.Flags.ViewChannel)}`)
          voiceChannel.permissionOverwrites.edit(env.ROLE_VERIFIED, {ViewChannel: true});
          verb = 'unhidden';
          console.log('Channel was hidden and has been unhidden')
          }
          // Else, lock the channel
          else {
          voiceChannel.permissionOverwrites.edit(env.ROLE_VERIFIED, {ViewChannel: false});
          verb = 'hidden';
          console.log('Channel is now hidden')
          }
        }
        else {
        await interaction.reply({
        content: 'You do not own this Tent!',
        ephemeral: true,
        });
        console.log(`User does not have the "mute members" permission in ${voiceChannel.name}`);
      }
    
      await interaction.reply({
      content: `${voiceChannel} has been ${verb}`,
      ephemeral: true,
      });
      return true;
    }
    };
    await interaction.reply({
    content: `error`,
    ephemeral: true,
    });
    return true;
  },
};
