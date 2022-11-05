/* eslint-disable no-unused-vars */
import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  Colors,
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import {SlashCommand} from '../../@types/commandDef';
import {startLog} from '../../utils/startLog';
import {embedTemplate} from '../../utils/embedTemplate';
import env from '../../../global/utils/env.config';
import log from '../../../global/utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const bug: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Say something like a real person!')
    .addStringOption((option) => option.setName('say')
      .setDescription('What do you want to say?')
      .setRequired(true))
    .addChannelOption((option) => option
      .setDescription(`Where should I say it? (Default: 'here')`)
      .setName('channel'),
    ),
  async execute(interaction) {
    startLog(PREFIX, interaction);
    if (!interaction.guild) {
      interaction.reply({
        content: 'This command can only be used in a server!',
        ephemeral: true,
      });
      return false;
    }

    const channel = interaction.options.getChannel('channel') as TextChannel;
    const say = interaction.options.getString('say', true);


    if (channel) {
      channel.send(say);
    } else {
      interaction.channel?.send(say);
    }

    interaction.reply({
      content: `I said '${say}' in ${channel ? channel.toString() : interaction.channel?.toString()}`,
      ephemeral: true},
    );

    const channelBotlog = interaction.guild.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    if (channelBotlog) {
      channelBotlog.send(`${(interaction.member as GuildMember).displayName} made me say '${say}' \
in ${channel ? channel.toString() : interaction.channel?.toString()}`);
    }

    return true;
  },
};
