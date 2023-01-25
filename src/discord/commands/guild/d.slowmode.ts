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
} from 'discord.js';
import {
  TextInputStyle,
} from 'discord-api-types/v10';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import { globalTemplate } from '../../../global/commands/_g.template';
import { startLog } from '../../utils/startLog';

const F = f(__filename);

export default dSlowmode;

export const dSlowmode: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Toggles slowmode on a channel')
    .addSubcommand(subcommand => subcommand
      .setName('on')
      .setDescription('Turn on slowmode')
      .addStringOption(option => option.setName('limit')
        .setDescription('How long between messags?')
        .addChoices(
          { name: '5s', value: '5' },
          { name: '10s', value: '10' },
          { name: '15s', value: '10' },
          { name: '30s', value: '30' },
          { name: '1m', value: '60' },
          { name: '2m', value: '120' },
          { name: '5m', value: '300' },
          { name: '10m', value: '600' },
        )
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('off')
      .setDescription('Turn on slowmode')),
  async execute(interaction) {
    startLog(F, interaction);

    const toggle = interaction.options.getSubcommand();
    const { channel } = interaction;
    const verb = toggle === 'on' ? 'enabled' : 'disabled';

    if (!(channel instanceof TextChannel)) {
      await interaction.reply({
        content: 'This command can only be used in a text channel',
        ephemeral: true,
      });
      return false;
    }

    if (toggle === 'on') {
      const limit = interaction.options.getString('limit', true);
      await channel.setRateLimitPerUser(parseInt(limit, 10));
    } else {
      await channel.setRateLimitPerUser(0);
    }

    await interaction.reply({
      content: `Slowmode ${verb} on ${channel}`,
      ephemeral: true,
    });

    const channelModerators = await interaction.guild?.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
    channelModerators.send({
      content: `${(interaction.member as GuildMember).displayName} ${verb} slowmode on ${channel}`,
    });

    return true;
  },
};
