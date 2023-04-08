import {
  SlashCommandBuilder,
  TextChannel,
  GuildMember,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { commandContext } from '../../utils/context';

const F = f(__filename);

export const dSlowMode: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Toggles slowmode on a channel')
    .addSubcommand(subcommand => subcommand
      .setName('on')
      .setDescription('Turn on slowmode')
      .addStringOption(option => option.setName('limit')
        .setDescription('How long between messages?')
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
      .setDescription('Turn off slowmode')),
  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });

    const toggle = interaction.options.getSubcommand();
    const { channel } = interaction;
    const verb = toggle === 'on' ? 'enabled' : 'disabled';

    if (!(channel instanceof TextChannel)) {
      await interaction.editReply({ content: 'This command can only be used in a text channel' });
      return false;
    }

    if (toggle === 'on') {
      const limit = interaction.options.getString('limit', true);
      await channel.setRateLimitPerUser(parseInt(limit, 10));
    } else {
      await channel.setRateLimitPerUser(0);
    }

    await interaction.editReply({ content: `Slowmode ${verb} on ${channel}` });

    const channelModerators = await interaction.guild?.channels.fetch(env.CHANNEL_MODERATORS) as TextChannel;
    channelModerators.send({
      content: `${(interaction.member as GuildMember).displayName} ${verb} slowmode on ${channel}`,
    });

    return true;
  },
};

export default dSlowMode;
