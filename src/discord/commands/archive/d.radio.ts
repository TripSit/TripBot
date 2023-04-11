/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  entersState,
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  AudioPlayerStatus,
} from '@discordjs/voice';
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  SlashCommandBuilder,
  TextChannel,
  ModalSubmitInteraction,
  VoiceChannel,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { globalTemplate } from '../../../global/commands/_g.template';
import commandContext from '../../utils/context';

const F = f(__filename);

export default dRadio;

export const dRadio: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Example!')
    .addSubcommand(subcommand => subcommand
      .setName('play')
      .setDescription('subcommand')
      .addStringOption(option => option.setName('url')
        .setDescription('The Soundcloud URL of the track.')
        .setRequired(true))),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    // This is a music bot command system that will take urls and play that music in a voice channel

    const url = interaction.options.getString('url');
    const { channel } = interaction;

    // Check if the channel is not a VoiceChannel
    if (!(channel instanceof VoiceChannel) || channel === null) {
      await interaction.reply({ content: 'You must play in a voice channel!', ephemeral: true });
      return false;
    }

    const existingConnection = getVoiceConnection(channel.guild.id);

    if (existingConnection) {
      await interaction.reply({ content: 'The bot is already in use, sorry about that!', ephemeral: true });
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Signalling, () => {
      log.debug(F, 'The connection has entered the Signalling state - requesting permission to join voice channel!');
    });

    connection.on(VoiceConnectionStatus.Connecting, () => {
      log.debug(F, 'The connection has entered the Connecting state - permission granted, joining voice channel!');
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
      log.debug(F, 'The connection has entered the Ready state - ready to play audio!');

      await interaction.reply({ content: `I have joined ${channel.name} and would start to play ${url}` });

      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });

      const resource = createAudioResource('/home/user/voice/track.mp3');

      player.play(resource);

      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        log.debug(F, 'The audio player is idle!');
      });

      player.on(AudioPlayerStatus.Buffering, () => {
        log.debug(F, 'The audio player has started buffering!');
      });

      player.on(AudioPlayerStatus.Playing, () => {
        log.debug(F, 'The audio player has started playing!');
      });

      player.on(AudioPlayerStatus.AutoPaused, () => {
        log.debug(F, 'The audio player has been autopaused!');
      });

      player.on(AudioPlayerStatus.Paused, () => {
        log.debug(F, 'The audio player has been paused!');
      });

      // player.on('error', error => {
      //   log.error(F, `Error: ${error.message} with resource ${(error.resource.metadata as any).title}`);
      //   player.play(getNextResource());
      // });
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      log.debug(F, 'The connection has entered the Disconnected  state - maybe network issues?');
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
        // Seems to be reconnecting to a new channel - ignore disconnect
      } catch (error) {
        // Seems to be a real disconnect which SHOULDN'T be recovered from
        connection.destroy();
      }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
      log.debug(F, 'The connection has entered the Destroyed state - stopped playing entirely!');
    });

    return true;
  },
};
