import {
  ChannelType,
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import { SlashCommand } from '../../@types/commandDef';
import commandContext from '../../utils/context'; // eslint-disable-line @typescript-eslint/no-unused-vars

const F = f(__filename);

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
    log.info(F, await commandContext(interaction));
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.guild) {
      await interaction.editReply({ content: 'This command can only be used in a server!' });
      return false;
    }

    const say = interaction.options.getString('say', true);

    let channel = interaction.options.getChannel('channel')
      ? interaction.options.getChannel('channel')
      : interaction.channel;

    // Ensure that the channel used is a text channel
    if (channel && channel.type !== ChannelType.GuildText) {
      await interaction.editReply({ content: 'This command can only be used in a server!' });
      return false;
    }

    // Set the type so it's not an API channel
    channel = channel as TextChannel;

    await channel.sendTyping(); // This method automatically stops typing after 10 seconds, or when a message is sent.
    setTimeout(async () => {
      await (channel as TextChannel).send(say);
    }, 1500);

    await interaction.editReply({ content: `I said '${say}' in ${channel.name}` }); // eslint-disable-line max-len

    const channelBotlog = await interaction.guild.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
    if (channelBotlog) {
      await channelBotlog.send(`${(interaction.member as GuildMember).displayName} made me say '${say}' \
in ${channel.name}`);
    }

    return true;
  },
};

export default dSay;
