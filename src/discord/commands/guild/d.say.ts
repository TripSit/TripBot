import {
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import { startLog } from '../../utils/startLog'; // eslint-disable-line @typescript-eslint/no-unused-vars

const F = f(__filename);

export default dSay;

export const dSay: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Say something like a real person!')
    .addStringOption(option => option.setName('say')
      .setDescription('What do you want to say?')
      .setRequired(true))
    .addChannelOption(option => option
      .setDescription('Where should I say it? (Default: \'here\')')
      .setName('channel')),
  async execute(interaction) {
    startLog(F, interaction);
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
      await channel.send(say);
    } else {
      await interaction.channel?.send(say);
    }

    interaction.reply({
      content: `I said '${say}' in ${channel ? channel.toString() : interaction.channel?.toString()}`,
      ephemeral: true,
    });

    const channelBotlog = interaction.guild.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    if (channelBotlog) {
      await channelBotlog.send(`${(interaction.member as GuildMember).displayName} made me say '${say}' \
in ${channel ? channel.toString() : interaction.channel?.toString()}`);
    }

    return true;
  },
};
